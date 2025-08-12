from decimal import Decimal

def get_cotacao_dolar_com_encargos():
    """
    Retorna a cotação fixa e final do dólar a ser usada em todo o sistema.
    """
    # Retorna diretamente o valor Decimal fixo.
    return Decimal('5.90')