import yaml
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db_manager import DatabaseManager

YAML_PATH = os.path.join(os.path.dirname(__file__), 'lof_config.yaml')
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'database', 'arb_master.db')

with open(YAML_PATH, 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)

funds = config.get('funds', [])
fund_list = []
for f in funds:
    fund_list.append({
        'category': f.get('category', '未知'),
        'code': str(f.get('code')),
        'name': f.get('name'),
        'related_index': f.get('trade_etf', '-')
    })

db = DatabaseManager(db_path=DB_PATH)
db.sync_unified_fund_list(fund_list)
print(f"Successfully synced {len(fund_list)} funds from lof_config.yaml to unified_fund_list table.")
