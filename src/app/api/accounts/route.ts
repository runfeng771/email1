import { NextRequest, NextResponse } from 'next/server'

interface EmailAccount {
  id: string
  email: string
  password: string
  imapServer: string
  imapPort: number
  smtpServer: string
  smtpPort: number
  isActive: boolean
}

// 模拟账号数据存储
let accounts: EmailAccount[] = [
  {
    id: '1',
    email: '18@HH.email.cn',
    password: '112233qq',
    imapServer: 'imap.email.cn',
    imapPort: 993,
    smtpServer: 'smtp.email.cn',
    smtpPort: 465,
    isActive: true
  },
  {
    id: '2',
    email: 'Steven@HH.email.cn',
    password: '112233qq',
    imapServer: 'imap.email.cn',
    imapPort: 993,
    smtpServer: 'smtp.email.cn',
    smtpPort: 465,
    isActive: true
  }
]

export async function GET() {
  try {
    // 返回账号列表，但不包含密码
    const safeAccounts = accounts.map(account => ({
      ...account,
      password: '***' // 隐藏密码
    }))
    return NextResponse.json(safeAccounts)
  } catch (error) {
    console.error('获取账号列表失败:', error)
    return NextResponse.json({ error: '获取账号列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, account } = body

    if (action === 'add') {
      // 添加新账号
      const newAccount: EmailAccount = {
        id: Date.now().toString(),
        ...account,
        isActive: true
      }
      accounts.push(newAccount)
      
      // 返回新账号，但不包含密码
      const safeAccount = {
        ...newAccount,
        password: '***'
      }
      
      return NextResponse.json(safeAccount)
    }

    if (action === 'update') {
      // 更新账号
      const index = accounts.findIndex(acc => acc.id === account.id)
      if (index !== -1) {
        accounts[index] = { ...accounts[index], ...account }
        
        // 返回更新后的账号，但不包含密码
        const safeAccount = {
          ...accounts[index],
          password: '***'
        }
        
        return NextResponse.json(safeAccount)
      }
      return NextResponse.json({ error: '账号不存在' }, { status: 404 })
    }

    if (action === 'delete') {
      // 删除账号
      const index = accounts.findIndex(acc => acc.id === account.id)
      if (index !== -1) {
        accounts.splice(index, 1)
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ error: '账号不存在' }, { status: 404 })
    }

    if (action === 'toggleActive') {
      // 切换账号激活状态
      const index = accounts.findIndex(acc => acc.id === account.id)
      if (index !== -1) {
        accounts[index].isActive = !accounts[index].isActive
        
        // 返回更新后的账号，但不包含密码
        const safeAccount = {
          ...accounts[index],
          password: '***'
        }
        
        return NextResponse.json(safeAccount)
      }
      return NextResponse.json({ error: '账号不存在' }, { status: 404 })
    }

    return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
  } catch (error) {
    console.error('账号操作失败:', error)
    return NextResponse.json({ error: '账号操作失败' }, { status: 500 })
  }
}