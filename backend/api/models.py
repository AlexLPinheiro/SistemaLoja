from django.db import models
from django.db.models import Sum, F
from django.db.models.fields import DecimalField
from decimal import Decimal

class Categoria(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class Produto(models.Model):
    nome = models.CharField(max_length=200)
    categoria = models.ForeignKey(Categoria, related_name='produtos', on_delete=models.SET_NULL, null=True)
    marca = models.CharField(max_length=100)
    preco_dolar = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço de custo em Dólar (U$)")

    @property
    def preco_real_custo(self):
        # Encargos de conversão e taxas
        ENCARGO_PERCENTUAL = Decimal('0.035')
        TAXA_CONVERSAO_PERCENTUAL = Decimal('0.019')
        FATOR_AJUSTE_CAMBIO = 1 + ENCARGO_PERCENTUAL + TAXA_CONVERSAO_PERCENTUAL
        
        # Taxa da Florida
        TAXA_FLORIDA_PERCENTUAL = Decimal('0.065') # 6.5%
        FATOR_FLORIDA = 1 + TAXA_FLORIDA_PERCENTUAL
        
        # Cotação base fixa para os cálculos internos dos modelos
        cotacao_comercial_base = Decimal('5.30')
        cotacao_ajustada = (cotacao_comercial_base * FATOR_AJUSTE_CAMBIO).quantize(Decimal('0.01'))
        
        # Calcula o custo base em reais (dólar * câmbio ajustado)
        custo_base_reais = self.preco_dolar * cotacao_ajustada
        
        # Aplica a taxa da Florida sobre o custo base
        custo_final_com_taxa = custo_base_reais * FATOR_FLORIDA
        
        return custo_final_com_taxa.quantize(Decimal('0.01'))

    @property
    def quantidade_vendas(self):
        return self.itens_pedido.aggregate(total_vendido=Sum('quantidade'))['total_vendido'] or 0

    def __str__(self):
        return self.nome

class Cliente(models.Model):
    nome_completo = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20)
    endereco = models.CharField(max_length=255)

    @property
    def total_gasto(self):
        total = self.pedidos.aggregate(
            total_geral=Sum(
                F('itens__preco_venda_unitario') * F('itens__quantidade'),
                output_field=DecimalField()
            )
        )['total_geral']
        return total or Decimal('0.00')

    def __str__(self):
        return self.nome_completo

class Pedido(models.Model):
    STATUS_PAGAMENTO_CHOICES = [('pago', 'Pago'), ('nao_pago', 'Não Pago'), ('em_atraso', 'Em Atraso'), ('em_dia', 'Em Dia')]
    STATUS_ENTREGA_CHOICES = [('entregue', 'Entregue'), ('nao_entregue', 'Não Entregue')]
    METODO_PAGAMENTO_CHOICES = [('a_vista', 'À Vista'), ('parcelado', 'Parcelado')]
    
    cliente = models.ForeignKey(Cliente, related_name='pedidos', on_delete=models.CASCADE)
    data_pedido = models.DateTimeField(auto_now_add=True)
    metodo_pagamento = models.CharField(max_length=20, choices=METODO_PAGAMENTO_CHOICES)
    quantidade_parcelas = models.IntegerField(default=1)
    dia_vencimento_parcela = models.IntegerField(null=True, blank=True, help_text="Dia do mês para vencimento das parcelas")
    status_pagamento = models.CharField(max_length=20, choices=STATUS_PAGAMENTO_CHOICES)
    status_entrega = models.CharField(max_length=20, choices=STATUS_ENTREGA_CHOICES, default='nao_entregue')
    
    # Novo campo para o valor do serviço
    valor_servico = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Taxa de serviço adicional para o pedido")
    
    produtos = models.ManyToManyField(Produto, through='PedidoProduto', related_name='pedidos')

    @property
    def status_pedido(self):
        pagamento_finalizado = self.status_pagamento in ['pago', 'em_dia']
        if self.status_entrega == 'entregue' and pagamento_finalizado:
            return 'fechado'
        return 'em_aberto'

    @property
    def subtotal(self):
        return self.itens.aggregate(
            subtotal=Sum(F('preco_venda_unitario') * F('quantidade'))
        )['subtotal'] or Decimal('0.00')
    
    @property
    def lucro_final(self):
        # O lucro total agora é a soma do lucro de todos os itens MAIS o valor do serviço.
        lucro_dos_itens = sum(item.lucro_item for item in self.itens.all())
        return lucro_dos_itens + self.valor_servico

class PedidoProduto(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='itens', on_delete=models.CASCADE)
    produto = models.ForeignKey(Produto, related_name='itens_pedido', on_delete=models.CASCADE)
    quantidade = models.IntegerField(default=1)
    preco_venda_unitario = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço em R$ que o produto foi vendido neste pedido")

    @property
    def lucro_item(self):
        # Este cálculo usa `self.produto.preco_real_custo`, que já tem todos os encargos embutidos.
        custo_total_item = self.produto.preco_real_custo * self.quantidade
        venda_total_item = self.preco_venda_unitario * self.quantidade
        return venda_total_item - custo_total_item

    class Meta:
        unique_together = ('pedido', 'produto')