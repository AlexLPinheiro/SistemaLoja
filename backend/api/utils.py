import requests
from decimal import Decimal
from django.core.cache import cache

def get_cotacao_dolar_com_encargos():
    """
    Busca a cotação atual do dólar, aplica os encargos de câmbio e armazena em cache.
    """
    cotacao_ajustada = cache.get('cotacao_dolar_ajustada')
    if cotacao_ajustada:
        return cotacao_ajustada

    ENCARGO_PERCENTUAL = Decimal('0.035')
    TAXA_CONVERSAO_PERCENTUAL = Decimal('0.019')
    FATOR_AJUSTE_CAMBIO = 1 + ENCARGO_PERCENTUAL + TAXA_CONVERSAO_PERCENTUAL

    try:
        response = requests.get('https://economia.awesomeapi.com.br/json/last/USD-BRL')
        response.raise_for_status()
        data = response.json()
        cotacao_comercial = Decimal(data['USDBRL']['bid'])
        cotacao_ajustada = (cotacao_comercial * FATOR_AJUSTE_CAMBIO).quantize(Decimal('0.01'))
    except (requests.exceptions.RequestException, KeyError) as e:
        print(f"Erro ao buscar cotação, usando valor padrão ajustado: {e}")
        cotacao_comercial_padrao = Decimal('5.30')
        cotacao_ajustada = (cotacao_comercial_padrao * FATOR_AJUSTE_CAMBIO).quantize(Decimal('0.01'))

    cache.set('cotacao_dolar_ajustada', cotacao_ajustada, 600)
    return cotacao_ajustada