# api/models.py
from django.db import models
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from decimal import Decimal

# Cotação do dólar (simplificada). Em um projeto real, isso viria de uma API externa.
COTACAO_DOLAR = Decimal('5.30') 

class Categoria(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class Produto(models.Model):
    nome = models.CharField(max_length=200)
    categoria = models.ForeignKey(Categoria, related_name='produtos', on_delete=models.SET_NULL, null=True)
    marca = models.CharField(max_length=100) # Campo de texto simples para a marca
    preco_dolar = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço de custo em Dólar (U$)")

    @property
    def preco_real_custo(self):
        # Propriedade para calcular o preço em reais automaticamente
        return (self.preco_dolar * COTACAO_DOLAR).quantize(Decimal('0.01'))

    @property
    def quantidade_vendas(self):
        # Calcula a quantidade de vendas agregando os itens de pedido
        return self.itens_pedido.aggregate(total_vendido=Sum('quantidade'))['total_vendido'] or 0

    def __str__(self):
        return self.nome

class Cliente(models.Model):
    nome_completo = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20)
    endereco = models.CharField(max_length=255)

    @property
    def total_gasto(self):
        # Soma o subtotal de todos os pedidos FECHADOS do cliente
        total = self.pedidos.filter(
            status_entrega='entregue', 
            status_pagamento__in=['pago', 'em_dia']
        ).aggregate(
            total=Sum(F('itens__preco_venda_unitario') * F('itens__quantidade'))
        )['total']
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

    produtos = models.ManyToManyField(Produto, through='PedidoProduto', related_name='pedidos')

    @property
    def status_pedido(self):
        # Lógica para definir se o pedido está "em aberto" ou "fechado"
        pagamento_finalizado = self.status_pagamento in ['pago', 'em_dia']
        if self.status_entrega == 'entregue' and pagamento_finalizado:
            return 'fechado'
        return 'em_aberto'

    @property
    def subtotal(self):
        # Calcula o subtotal somando o valor de todos os itens do pedido
        return self.itens.aggregate(
            subtotal=Sum(F('preco_venda_unitario') * F('quantidade'))
        )['subtotal'] or Decimal('0.00')
    
    @property
    def lucro_final(self):
        # Calcula o lucro somando o (preço de venda - preço de custo) de cada item
        lucro = self.itens.aggregate(
            lucro_total=Sum(
                (F('preco_venda_unitario') - (F('produto__preco_dolar') * COTACAO_DOLAR)) * F('quantidade')
            )
        )['lucro_total']
        return lucro or Decimal('0.00')

class PedidoProduto(models.Model):
    """ Tabela 'through' para armazenar detalhes do produto DENTRO de um pedido específico """
    pedido = models.ForeignKey(Pedido, related_name='itens', on_delete=models.CASCADE)
    produto = models.ForeignKey(Produto, related_name='itens_pedido', on_delete=models.CASCADE)
    quantidade = models.IntegerField(default=1)
    preco_venda_unitario = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço em R$ que o produto foi vendido neste pedido")

    class Meta:
        unique_together = ('pedido', 'produto')