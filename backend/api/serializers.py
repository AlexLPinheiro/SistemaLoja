from rest_framework import serializers
from django.db import transaction
from django.db.models import F
from decimal import Decimal

# Importa os modelos e a função utilitária
from .models import Categoria, Produto, Cliente, Pedido, PedidoProduto
from .utils import get_cotacao_dolar_com_encargos

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nome']

class ProdutoSerializer(serializers.ModelSerializer):
    quantidade_vendas = serializers.IntegerField(read_only=True)
    categoria = serializers.CharField(source='categoria.nome', read_only=True)
    categoria_id = serializers.IntegerField(write_only=True)
    adicionar_estoque = serializers.IntegerField(write_only=True, required=False, default=0, min_value=0)

    class Meta:
        model = Produto
        fields = [
            'id', 'nome', 'categoria', 'marca', 'preco_dolar', 
            'quantidade_vendas', 'quantidade_estoque', 
            'categoria_id', 'adicionar_estoque'
            # REMOVA 'preco_real_custo' desta lista
        ]
        read_only_fields = ['quantidade_estoque']
    
    def create(self, validated_data):
        # Remove 'adicionar_estoque' pois ele não é usado na criação, apenas na atualização
        validated_data.pop('adicionar_estoque', None)
        
        categoria_id = validated_data.pop('categoria_id')
        try:
            categoria_instance = Categoria.objects.get(id=categoria_id)
        except Categoria.DoesNotExist:
            raise serializers.ValidationError({"categoria_id": "Categoria com este ID não existe."})
        
        produto = Produto.objects.create(categoria=categoria_instance, **validated_data)
        return produto

    def update(self, instance, validated_data):
        # Pega a quantidade a ser adicionada do payload validado
        quantidade_a_adicionar = validated_data.pop('adicionar_estoque', 0)

        # Se uma quantidade foi fornecida, incrementa o estoque de forma segura
        if quantidade_a_adicionar > 0:
            # Usar F() object evita race conditions (condições de corrida) no banco de dados
            instance.quantidade_estoque = F('quantidade_estoque') + quantidade_a_adicionar
        
        # Atualiza os outros campos normalmente
        instance.nome = validated_data.get('nome', instance.nome)
        instance.marca = validated_data.get('marca', instance.marca)
        instance.preco_dolar = validated_data.get('preco_dolar', instance.preco_dolar)
        
        if 'categoria_id' in validated_data:
            categoria_instance = Categoria.objects.get(id=validated_data['categoria_id'])
            instance.categoria = categoria_instance

        instance.save()
        # Precisamos recarregar a instância para obter o valor atualizado do estoque do banco de dados
        instance.refresh_from_db()
        return instance

class PedidoProdutoCreateSerializer(serializers.ModelSerializer):
    produto_id = serializers.IntegerField()

    class Meta:
        model = PedidoProduto
        fields = ['produto_id', 'quantidade', 'margem_venda_unitaria']

class PedidoCreateSerializer(serializers.ModelSerializer):
    itens = PedidoProdutoCreateSerializer(many=True)
    cliente_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = Pedido
        fields = [
            'cliente_id', 'metodo_pagamento', 'quantidade_parcelas', 
            'dia_vencimento_parcela', 'status_pagamento', 'valor_servico', 'itens'
        ]

    def create(self, validated_data):
        itens_data = validated_data.pop('itens')
        cliente_id = validated_data.pop('cliente_id')
        
        try:
            with transaction.atomic():
                # Validação de Estoque
                for item_data in itens_data:
                    produto = Produto.objects.get(id=item_data['produto_id'])
                    if produto.quantidade_estoque < item_data['quantidade']:
                        raise serializers.ValidationError(
                            f"Estoque insuficiente para '{produto.nome}'. "
                            f"Disponível: {produto.quantidade_estoque}, Solicitado: {item_data['quantidade']}."
                        )

                # Criação do Pedido
                cliente_instance = Cliente.objects.get(id=cliente_id)
                pedido = Pedido.objects.create(cliente=cliente_instance, **validated_data)
                
                cotacao_do_dia_com_encargos = get_cotacao_dolar_com_encargos()
                
                # Criação dos Itens e Decremento do Estoque
                for item_data in itens_data:
                    produto_instance = Produto.objects.get(id=item_data['produto_id'])
                    
                    produto_instance.quantidade_estoque -= item_data['quantidade']
                    produto_instance.save()
                    
                    TAXA_FLORIDA_PERCENTUAL = Decimal('0.065')
                    FATOR_FLORIDA = 1 + TAXA_FLORIDA_PERCENTUAL
                    
                    custo_base_reais = produto_instance.preco_dolar * cotacao_do_dia_com_encargos
                    custo_final_com_taxa = (custo_base_reais * FATOR_FLORIDA).quantize(Decimal('0.01'))
                    
                    # Remove 'produto_id' antes de passar para a criação do PedidoProduto
                    item_data.pop('produto_id')
                    
                    PedidoProduto.objects.create(
                        pedido=pedido, 
                        produto=produto_instance, 
                        custo_real_item_unidade=custo_final_com_taxa,
                        **item_data
                    )
            return pedido

        except Cliente.DoesNotExist:
            raise serializers.ValidationError({"cliente_id": f"Cliente com ID {cliente_id} não encontrado."})
        except Produto.DoesNotExist:
            raise serializers.ValidationError({"produto_id": "Um dos produtos do pedido não foi encontrado."})

class PedidoProdutoSerializer(serializers.ModelSerializer):
    produto = ProdutoSerializer(read_only=True)
    lucro_item = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal_item = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PedidoProduto
        fields = ['id', 'produto', 'quantidade', 'margem_venda_unitaria', 'lucro_item', 'subtotal_item', 'custo_real_item_unidade']

class PedidoSerializer(serializers.ModelSerializer):
    itens = PedidoProdutoSerializer(many=True, read_only=True)
    status_pedido = serializers.CharField(read_only=True)
    lucro_final = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cliente = serializers.CharField(source='cliente.nome_completo', read_only=True)
    subtotal_itens = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    valor_total_venda = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'data_pedido', 'metodo_pagamento', 'quantidade_parcelas',
            'dia_vencimento_parcela', 'status_pagamento', 'status_entrega', 
            'status_pedido', 'subtotal_itens', 'valor_servico', 
            'valor_total_venda', 'lucro_final', 'itens'
        ]

class ClienteListSerializer(serializers.ModelSerializer):
    total_gasto = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Cliente
        fields = ['id', 'nome_completo', 'telefone', 'endereco', 'total_gasto']

class ClienteDetailSerializer(serializers.ModelSerializer):
    total_gasto = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    pedidos = PedidoSerializer(many=True, read_only=True)

    class Meta:
        model = Cliente
        fields = ['id', 'nome_completo', 'telefone', 'endereco', 'total_gasto', 'pedidos']