import requests
from decimal import Decimal
from django.core.cache import cache

def get_cotacao_dolar_com_encargos():
    """
    Busca a cotação atual do dólar, aplica os encargos de câmbio e armazena em cache.
    Esta função é usada para o Dashboard e para o momento de criação de um pedido.
    A taxa da Flórida NÃO é aplicada aqui, pois ela incide sobre o preço do produto,
    não sobre a cotação em si.
    """
    # Tenta pegar o valor já ajustado do cache primeiro (duração de 10 minutos)
    cotacao_ajustada = cache.get('cotacao_dolar_ajustada')
    if cotacao_ajustada:
        return cotacao_ajustada

    # Constantes para os encargos de câmbio
    ENCARGO_PERCENTUAL = Decimal('0.035')  # 3.5%
    TAXA_CONVERSAO_PERCENTUAL = Decimal('0.019')  # 1.9%
    FATOR_AJUSTE_CAMBIO = 1 + ENCARGO_PERCENTUAL + TAXA_CONVERSAO_PERCENTUAL

    try:
        # 1. Busca a cotação comercial da API externa
        response = requests.get('https://economia.awesomeapi.com.br/json/last/USD-BRL')
        response.raise_for_status() # Lança um erro se a requisição falhar
        data = response.json()
        cotacao_comercial = Decimal(data['USDBRL']['bid'])
        
        # 2. Aplica o fator de ajuste de câmbio
        cotacao_ajustada = (cotacao_comercial * FATOR_AJUSTE_CAMBIO).quantize(Decimal('0.01'))

    except (requests.exceptions.RequestException, KeyError) as e:
        print(f"Erro ao buscar cotação do dólar, usando valor padrão ajustado: {e}")
        # Usa um valor padrão seguro E TAMBÉM APLICA O AJUSTE nele
        cotacao_comercial_padrao = Decimal('5.30')
        cotacao_ajustada = (cotacao_comercial_padrao * FATOR_AJUSTE_CAMBIO).quantize(Decimal('0.01'))

    # 3. Armazena o valor FINAL (já ajustado) no cache por 600 segundos (10 minutos)
    cache.set('cotacao_dolar_ajustada', cotacao_ajustada, 600)
    
    return cotacao_ajustada