from rest_framework import serializers
from .models import Categoria, Produto, Cliente, Pedido, PedidoProduto

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nome']

class ProdutoSerializer(serializers.ModelSerializer):
    """
    Serializer para LER (GET) dados de Produtos.
    Inclui campos calculados e nomes de relações.
    """
    preco_real_custo = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    quantidade_vendas = serializers.IntegerField(read_only=True)
    categoria = serializers.CharField(source='categoria.nome', read_only=True)
    categoria_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Produto
        fields = [
            'id', 'nome', 'categoria', 'marca', 'preco_dolar', 
            'preco_real_custo', 'quantidade_vendas', 'categoria_id'
        ]
    
    def create(self, validated_data):
        categoria_id = validated_data.pop('categoria_id')
        try:
            categoria_instance = Categoria.objects.get(id=categoria_id)
        except Categoria.DoesNotExist:
            raise serializers.ValidationError({"categoria_id": "Categoria com este ID não existe."})
        
        produto = Produto.objects.create(categoria=categoria_instance, **validated_data)
        return produto

# --- SERIALIZERS PARA CRIAÇÃO DE PEDIDOS ---

class PedidoProdutoCreateSerializer(serializers.ModelSerializer):
    """ Serializer para um item de pedido DURANTE A CRIAÇÃO (POST) """
    produto_id = serializers.IntegerField()

    class Meta:
        model = PedidoProduto
        fields = ['produto_id', 'quantidade', 'preco_venda_unitario']

class PedidoCreateSerializer(serializers.ModelSerializer):
    """ Serializer para o pedido completo DURANTE A CRIAÇÃO (POST) """
    itens = PedidoProdutoCreateSerializer(many=True)
    cliente_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = Pedido
        fields = [
            'cliente_id',
            'metodo_pagamento', 
            'quantidade_parcelas', 
            'dia_vencimento_parcela', 
            'status_pagamento', 
            'valor_servico', # Adicionado aqui
            'itens'
        ]

    def create(self, validated_data):
        itens_data = validated_data.pop('itens')
        cliente_id = validated_data.pop('cliente_id')
        
        try:
            cliente_instance = Cliente.objects.get(id=cliente_id)
        except Cliente.DoesNotExist:
            raise serializers.ValidationError({"cliente_id": f"Cliente com ID {cliente_id} não encontrado."})
        
        pedido = Pedido.objects.create(cliente=cliente_instance, **validated_data)
        
        for item_data in itens_data:
            produto_id = item_data.pop('produto_id')
            try:
                produto_instance = Produto.objects.get(id=produto_id)
                PedidoProduto.objects.create(pedido=pedido, produto=produto_instance, **item_data)
            except Produto.DoesNotExist:
                print(f"Produto com ID {produto_id} não encontrado. Item ignorado.")
                continue
            
        return pedido

# --- SERIALIZERS PARA LEITURA DE PEDIDOS E CLIENTES ---

class PedidoProdutoSerializer(serializers.ModelSerializer):
    """ Serializer para LER (GET) os itens de um pedido """
    produto = ProdutoSerializer(read_only=True)
    lucro_item = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PedidoProduto
        fields = ['id', 'produto', 'quantidade', 'preco_venda_unitario', 'lucro_item']

class PedidoSerializer(serializers.ModelSerializer):
    """ Serializer para LER (GET) um pedido """
    itens = PedidoProdutoSerializer(many=True, read_only=True)
    status_pedido = serializers.CharField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    lucro_final = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cliente = serializers.CharField(source='cliente.nome_completo', read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'data_pedido', 'metodo_pagamento', 'quantidade_parcelas',
            'dia_vencimento_parcela', 'status_pagamento', 'status_entrega', 
            'status_pedido', 'subtotal', 
            'valor_servico', # Adicionado aqui
            'lucro_final', 'itens'
        ]

class ClienteListSerializer(serializers.ModelSerializer):
    """ Serializer para a LISTA (GET) de clientes """
    total_gasto = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Cliente
        fields = ['id', 'nome_completo', 'telefone', 'endereco', 'total_gasto']

class ClienteDetailSerializer(serializers.ModelSerializer):
    """ Serializer para os DETALHES (GET) de um cliente """
    total_gasto = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    pedidos = PedidoSerializer(many=True, read_only=True)

    class Meta:
        model = Cliente
        fields = ['id', 'nome_completo', 'telefone', 'endereco', 'total_gasto', 'pedidos']