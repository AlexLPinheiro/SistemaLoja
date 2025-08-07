import requests
from decimal import Decimal
from rest_framework import viewsets, views, response, status
from rest_framework.filters import SearchFilter
from rest_framework.decorators import action
from django.db.models import Count, Q

# Importa os modelos
from .models import Categoria, Produto, Cliente, Pedido

# Importa os serializers
from .serializers import (
    CategoriaSerializer, ProdutoSerializer, 
    ClienteListSerializer, ClienteDetailSerializer, PedidoSerializer, PedidoCreateSerializer
)

# Importa a função utilitária para a cotação do dólar
from .utils import get_cotacao_dolar_com_encargos

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
            pedidos_em_aberto=Count('pedidos', filter=filtro_pedidos_abertos)
        ).order_by('-pedidos_em_aberto')

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer
    filter_backends = [SearchFilter]
    search_fields = ['cliente__nome_completo']

    def get_serializer_class(self):
        # Usa um serializer diferente para criar um pedido
        if self.action == 'create':
            return PedidoCreateSerializer
        return PedidoSerializer
    
    @action(detail=True, methods=['patch'], url_path='atualizar-status')
    def atualizar_status(self, request, pk=None):
        pedido = self.get_object()
        novo_status_pagamento = request.data.get('status_pagamento')
        novo_status_entrega = request.data.get('status_entrega')
        alterado = False
        if novo_status_pagamento and novo_status_pagamento in [c[0] for c in Pedido.STATUS_PAGAMENTO_CHOICES]:
            pedido.status_pagamento = novo_status_pagamento
            alterado = True
        if novo_status_entrega and novo_status_entrega in [c[0] for c in Pedido.STATUS_ENTREGA_CHOICES]:
            pedido.status_entrega = novo_status_entrega
            alterado = True
        if alterado:
            pedido.save()
            serializer = self.get_serializer(pedido)
            return response.Response(serializer.data)
        else:
            return response.Response(
                {"detail": "Nenhum status válido foi fornecido."},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_queryset(self):
        # Prioriza pedidos em aberto na listagem
        return Pedido.objects.all().extra(
           select={'is_aberto': "status_entrega <> 'entregue' OR status_pagamento <> 'pago'"},
           order_by=['-is_aberto']
        )

class DashboardView(views.APIView):
    def get(self, request, *args, **kwargs):
        # Usa a função utilitária para buscar a cotação do dia
        cotacao_dolar_atual = get_cotacao_dolar_com_encargos()
        
        pedidos_abertos = Pedido.objects.filter(
            Q(status_entrega='nao_entregue') | ~Q(status_pagamento='pago')
        ).distinct().count()
        
        # Estes cálculos agora usam as propriedades atualizadas dos modelos
        lucro_total = sum(p.lucro_final for p in Pedido.objects.all())
        gastos_totais = sum(p.valor_total_venda for p in Pedido.objects.all())

        data = {
            'lucro_do_periodo': lucro_total,
            'gastos_do_periodo': gastos_totais,
            'cotacao_dolar_dia': cotacao_dolar_atual,
            'pedidos_em_aberto': pedidos_abertos
        }
        return response.Response(data)