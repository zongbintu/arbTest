/**
 * 公共下单逻辑 composable
 * 实时沙盘 (Analysis.vue) 和 懒人页面 (GodMode.vue) 共用
 */
import { useMessage, useDialog } from 'naive-ui'
import { placeOrder } from '../api/tradingApi'
import { addTrade } from '../api/ledgerApi'

export function useOrderLogic() {
  const message = useMessage()
  const dialog = useDialog()

  // ========== LOF 下单函数（共用） ==========
  const sendLofOrder = async (action, fundCode, fundName, lofPrice, lofQty, broker) => {
    if (!lofPrice || !lofQty) {
      message.warning('请输入价格和数量')
      return
    }
    
    const brokerName = broker === 'yinhe_qmt' ? '银河QMT' : (broker === 'tdx' ? '通达信' : '国金QMT')
    const actionName = action === 'BUY' ? '买入' : '卖出'
    
    dialog.warning({
      title: '确认下单',
      content: `您将向 [${brokerName}] 发起实盘委托，请确认参数：\n\n` +
        `・ 标的代码: ${fundCode}\n` +
        `・ 委托方向: ${actionName}\n` +
        `・ 委托价格: ￥${lofPrice.toFixed(3)}\n` +
        `・ 委托数量: ${lofQty} 股`,
      positiveText: '确认发送',
      negativeText: '取消',
      onPositiveClick: async () => {
        message.loading('正在发送委托指令，请稍候...')
        try {
          const res = await placeOrder({ action, code: fundCode, volume: lofQty, price: lofPrice, broker })
          if (res.data.status === 'ok') {
            message.success(`下单结果: ${res.data.message}`)
            await addTrade({
              fund_code: fundCode, fund_name: fundName, action,
              volume: lofQty, price: lofPrice,
              hedge_symbol: '', hedge_price: 0, hedge_vol: 0,
            })
          } else {
            message.error(`下单失败: ${res.data.message}`)
            dialog.error({
              title: '下单失败',
              content: `券商/通道接口返回错误: ${res.data.message}`,
            })
          }
        } catch (e) {
          message.error(`接口调用异常: ${e.message || e}`)
        }
      },
    })
  }

  // ========== IB 下单函数（共用） ==========
  const sendIbOrder = async (action, tradeEtf, hedgePrice, hedgeVol) => {
    if (!tradeEtf) {
      message.warning('未检测到交易标的')
      return
    }
    
    dialog.warning({
      title: '确认下单',
      content: `您将向 [IB (盈透证券)] 发起实盘委托，请确认参数：\n\n` +
        `・ 标的代码: ${tradeEtf}\n` +
        `・ 委托方向: ${action === 'BUY' ? '买入' : '卖出'}\n` +
        `・ 委托价格: $${hedgePrice.toFixed(2)}\n` +
        `・ 委托数量: ${hedgeVol}`,
      positiveText: '确认发送',
      negativeText: '取消',
      onPositiveClick: async () => {
        message.loading('正在发送委托指令，请稍候...')
        try {
          const res = await placeOrder({ action, code: tradeEtf, volume: hedgeVol, price: hedgePrice, broker: 'ib' })
          if (res.data.status === 'ok') {
            message.success(`下单结果: ${res.data.message}`)
          } else {
            message.error(`下单失败: ${res.data.message}`)
            dialog.error({
              title: '下单失败',
              content: `券商/通道接口返回错误: ${res.data.message}`,
            })
          }
        } catch (e) {
          message.error(`接口调用异常: ${e.message || e}`)
        }
      },
    })
  }

  return { sendLofOrder, sendIbOrder }
}
