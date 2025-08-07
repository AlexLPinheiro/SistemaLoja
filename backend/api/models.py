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
    categoria = models.ForeignKey('Categoria', related_name='produtos', on_delete=models.SET_NULL, null=True)
    marca = models.CharField(max_length=100)
    preco_dolar = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço de custo em Dólar (U$)")
    quantidade_estoque = models.IntegerField(default=0, help_text="Quantidade disponível em estoque")

    @property
    def quantidade_vendas(self):
        total_vendido = self.itens_pedido.aggregate(total=Sum('quantidade'))['total']
        return total_vendido or 0

    def __str__(self):
        return self.nome

class Cliente(models.Model):
    nome_completo = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20)
    endereco = models.CharField(max_length=255)

    @property
    def total_gasto(self):
        total_pago = sum(pedido.valor_total_venda for pedido in self.pedidos.all())
        return total_pago or Decimal('0.00')

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
    valor_servico = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Taxa de serviço adicional para o pedido")
    produtos = models.ManyToManyField(Produto, through='PedidoProduto', related_name='pedidos')

    @property
    def status_pedido(self):
        pagamento_finalizado = self.status_pagamento in ['pago', 'em_dia']
        if self.status_entrega == 'entregue' and pagamento_finalizado:
            return 'fechado'
        return 'em_aberto'

    @property
    def subtotal_itens(self):
        return sum(item.subtotal_item for item in self.itens.all())

    @property
    def valor_total_venda(self):
        return self.subtotal_itens + self.valor_servico
    
    @property
    def lucro_final(self):
        lucro_dos_itens = sum(item.lucro_item for item in self.itens.all())
        return lucro_dos_itens + self.valor_servico

class PedidoProduto(models.Model):
    pedido = models.ForeignKey('Pedido', related_name='itens', on_delete=models.CASCADE)
    produto = models.ForeignKey(Produto, related_name='itens_pedido', on_delete=models.CASCADE)
    quantidade = models.IntegerField(default=1)
    margem_venda_unitaria = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Valor adicionado ao custo do produto (lucro por unidade)")
    custo_real_item_unidade = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    @property
    def subtotal_item(self):
        custo_historico = self.custo_real_item_unidade or Decimal('0.00')
        preco_final_unitario = custo_historico + self.margem_venda_unitaria
        return preco_final_unitario * self.quantidade

    @property
    def lucro_item(self):
        return self.margem_venda_unitaria * self.quantidade

    @property
    def custo_dolar_item_total(self):
        return self.produto.preco_dolar * self.quantidade

    @property
    def lucro_dolar_item_total(self):
        COTACAO_BASE_REVERSA = Decimal('5.30')
        if COTACAO_BASE_REVERSA > 0:
            margem_em_dolar = self.margem_venda_unitaria / COTACAO_BASE_REVERSA
            return margem_em_dolar * self.quantidade
        return Decimal('0.00')

    class Meta:
        unique_together = ('pedido', 'produto')