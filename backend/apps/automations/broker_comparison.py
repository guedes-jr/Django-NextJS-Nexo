"""
API de comparativo de corretoras
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


BROKER_FEATURES = {
    'XP': {
        'name': 'XP Investimentos',
        'logo': 'XP',
        'rates': {
            'actions': {'min': 0, 'max': 0.5, 'type': 'flat', 'description': 'R$ 0,00 a R$ 50,00 por ordem'},
            'options': {'min': 0.5, 'max': 2.0, 'type': 'percentage', 'description': '0,5% a 2% por operação'},
            'fii': {'min': 0.1, 'max': 0.3, 'type': 'percentage', 'description': '0,1% a 0,3% por operação'},
            'crypto': {'min': 0.3, 'max': 0.7, 'type': 'percentage', 'description': '0,3% a 0,7% por operação'},
        },
        'features': ['Ações', 'FIIs', 'ETF', 'Derivativos', 'Crypto', 'Fundoscurrency'],
        'min_investment': 0,
        'has_pfp': True,
        'has_advice': True,
        'has_banking': True,
        'rating': 4.5,
    },
    'CLEAR': {
        'name': 'Clear Corretora',
        'logo': 'Clear',
        'rates': {
            'actions': {'min': 0, 'max': 0.4, 'type': 'flat', 'description': 'R$ 0,00 a R$ 40,00 por ordem'},
            'options': {'min': 0.5, 'max': 1.8, 'type': 'percentage', 'description': '0,5% a 1,8% por operação'},
            'fii': {'min': 0.1, 'max': 0.25, 'type': 'percentage', 'description': '0,1% a 0,25% por operação'},
        },
        'features': ['Ações', 'FIIs', 'ETF', 'Derivativos'],
        'min_investment': 0,
        'has_pfp': False,
        'has_advice': False,
        'has_banking': False,
        'rating': 4.2,
    },
    'RICO': {
        'name': 'Rico Corretora',
        'logo': 'Rico',
        'rates': {
            'actions': {'min': 0, 'max': 0.5, 'type': 'flat', 'description': 'R$ 0,00 a R$ 50,00 por ordem'},
            'options': {'min': 0.5, 'max': 2.0, 'type': 'percentage', 'description': '0,5% a 2% por operação'},
            'fii': {'min': 0.1, 'max': 0.3, 'type': 'percentage', 'description': '0,1% a 0,3% por operação'},
            'treasury': {'min': 0, 'max': 0.1, 'type': 'percentage', 'description': 'Taxa Zero'},
        },
        'features': ['Ações', 'FIIs', 'ETF', 'Tesouro Direto', 'Derivativos'],
        'min_investment': 0,
        'has_pfp': True,
        'has_advice': True,
        'has_banking': True,
        'rating': 4.3,
    },
    'MODAL': {
        'name': 'ModalMais',
        'logo': 'Modal',
        'rates': {
            'actions': {'min': 0, 'max': 0.45, 'type': 'flat', 'description': 'R$ 0,00 a R$ 45,00 por ordem'},
            'options': {'min': 0.5, 'max': 1.5, 'type': 'percentage', 'description': '0,5% a 1,5% por operação'},
            'fii': {'min': 0.08, 'max': 0.2, 'type': 'percentage', 'description': '0,08% a 0,2% por operação'},
        },
        'features': ['Ações', 'FIIs', 'ETF', 'Derivativos'],
        'min_investment': 0,
        'has_pfp': False,
        'has_advice': False,
        'has_banking': True,
        'rating': 4.1,
    },
    'NUBANK': {
        'name': 'Nubank',
        'logo': 'Nubank',
        'rates': {
            'actions': {'min': 0, 'max': 0.5, 'type': 'flat', 'description': 'R$ 0,50 a R$ 50,00 por ordem'},
            'fii': {'min': 0.15, 'max': 0.3, 'type': 'percentage', 'description': '0,15% a 0,3% por operação'},
            'treasury': {'min': 0, 'max': 0.1, 'type': 'percentage', 'description': 'Taxa Zero'},
        },
        'features': ['Ações', 'FIIs', 'Tesouro Direto'],
        'min_investment': 0,
        'has_pfp': True,
        'has_advice': False,
        'has_banking': True,
        'rating': 4.0,
    },
    'INTER': {
        'name': 'Banco Inter',
        'logo': 'Inter',
        'rates': {
            'actions': {'min': 0, 'max': 0.5, 'type': 'flat', 'description': 'R$ 0,00 a R$ 50,00 por ordem'},
            'fii': {'min': 0.1, 'max': 0.25, 'type': 'percentage', 'description': '0,1% a 0,25% por operação'},
            'treasury': {'min': 0, 'max': 0.1, 'type': 'percentage', 'description': 'Taxa Zero'},
        },
        'features': ['Ações', 'FIIs', 'ETF', 'Tesouro Direto'],
        'min_investment': 0,
        'has_pfp': True,
        'has_advice': True,
        'has_banking': True,
        'rating': 4.2,
    },
}


class BrokerComparisonView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        asset_type = request.query_params.get('asset_type', 'actions')
        sort_by = request.query_params.get('sort', 'fee')
        
        brokers = []
        
        for code, data in BROKER_FEATURES.items():
            rate_info = data['rates'].get(asset_type, {})
            
            broker = {
                'code': code,
                'name': data['name'],
                'logo': data['logo'],
                'fee_min': rate_info.get('min', 0),
                'fee_max': rate_info.get('max', 0),
                'fee_type': rate_info.get('type', ''),
                'fee_description': rate_info.get('description', ''),
                'features': data['features'],
                'has_pfp': data['has_pfp'],
                'has_advice': data['has_advice'],
                'has_banking': data['has_banking'],
                'rating': data['rating'],
            }
            brokers.append(broker)
        
        if sort_by == 'fee':
            brokers.sort(key=lambda x: x['fee_min'])
        elif sort_by == 'rating':
            brokers.sort(key=lambda x: x['rating'], reverse=True)
        elif sort_by == 'features':
            brokers.sort(key=lambda x: len(x['features']), reverse=True)
        
        return Response({
            'asset_type': asset_type,
            'brokers': brokers,
            'available_asset_types': list(set(
                t for b in BROKER_FEATURES.values() for t in b['rates'].keys()
            ))
        })


class BrokerFeesCalculatorView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        data = request.data
        broker_code = data.get('broker')
        asset_type = data.get('asset_type', 'actions')
        value = float(data.get('value', 10000))
        operations = int(data.get('operations', 1))
        
        if broker_code not in BROKER_FEATURES:
            return Response({'error': 'Corretora não encontrada'}, status=404)
        
        broker = BROKER_FEATURES[broker_code]
        rate_info = broker['rates'].get(asset_type, {})
        
        if rate_info.get('type') == 'flat':
            min_fee = rate_info.get('min', 0)
            max_fee = rate_info.get('max', 0)
            total_fee = (min_fee + max_fee) / 2 * operations
            fee_per_operation = (min_fee + max_fee) / 2
        else:
            fee_rate = (rate_info.get('min', 0) + rate_info.get('max', 0)) / 2
            total_fee = value * (fee_rate / 100) * operations
            fee_per_operation = value * (fee_rate / 100)
        
        annual_operations = operations * 12
        annual_fee = fee_per_operation * annual_operations
        
        return Response({
            'broker': broker['name'],
            'asset_type': asset_type,
            'operation_value': value,
            'operations_per_month': operations,
            'fee_per_operation': round(fee_per_operation, 2),
            'monthly_fee': round(fee_per_operation * operations, 2),
            'annual_fee': round(annual_fee, 2),
            'fee_description': rate_info.get('description', ''),
        })