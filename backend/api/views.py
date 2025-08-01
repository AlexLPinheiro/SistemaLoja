# api/views.py
from rest_framework import viewsets, views, response
from rest_framework.filters import SearchFilter
from django.db.models import Count, Q
from .models import Categoria, Produto, Cliente, Pedido, COTACAO_DOLAR
from .serializers import (
    CategoriaSerializer, ProdutoSerializer, 
    ClienteListSerializer, ClienteDetailSerializer, PedidoSerializer, PedidoCreateSerializer
)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class ProdutoViewSet(viewsets.ModelViewSet):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer

    filter_backends = [SearchFilter]
    search_fields = ['nome', 'marca', 'categoria__nome']

    def get_queryset(self):
        # Anota cada produto com a contagem de vendas e ordena por ela
        return Produto.objects.annotate(
            vendas_count=Count('itens_pedido')
        ).order_by('-vendas_count')

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()

    filter_backends = [SearchFilter]
    search_fields = ['nome_completo', 'telefone', 'endereco']

    def get_serializer_class(self):
        # Usa um serializer diferente para a lista e para o detalhe
        if self.action == 'retrieve':
            return ClienteDetailSerializer
        return ClienteListSerializer

    def get_queryset(self):
        # Prioriza clientes com pedidos em aberto
        filtro_pedidos_abertos = Q(pedidos__status_entrega='nao_entregue') | Q(pedidos__status_pagamento__in=['nao_pago', 'em_atraso'])

        return Cliente.objects.annotate(
            # Contamos quantos pedidos por cliente correspondem ao nosso filtro
            pedidos_em_aberto=Count('pedidos', filter=filtro_pedidos_abertos)
        ).order_by('-pedidos_em_aberto')

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer

    def get_serializer_class(self):
        # Se a ação for 'create', usa o nosso novo serializer
        if self.action == 'create':
            return PedidoCreateSerializer
        # Para todas as outras ações (list, retrieve, etc.), usa o padrão
        return PedidoSerializer

    def get_queryset(self):
        # Prioriza pedidos em aberto
        return Pedido.objects.all().extra(
           select={'is_aberto': "status_entrega <> 'entregue' OR status_pagamento <> 'pago'"},
           order_by=['-is_aberto']
        )

class DashboardView(views.APIView):
    def get(self, request, *args, **kwargs):
        # Agregações para o dashboard
        pedidos_abertos = Pedido.objects.filter(
            Q(status_entrega='nao_entregue') | ~Q(status_pagamento='pago')
        ).distinct().count()
        
        # Estas queries podem ser pesadas. No futuro, otimizar.
        lucro_total = sum(p.lucro_final for p in Pedido.objects.all())
        gastos_totais = sum(p.subtotal for p in Pedido.objects.all())

        data = {
            'lucro_do_periodo': lucro_total,
            'gastos_do_periodo': gastos_totais,
            'cotacao_dolar_dia': COTACAO_DOLAR,
            'pedidos_em_aberto': pedidos_abertos
        }
        return response.Response(data)