import { NextRequest, NextResponse } from 'next/server'
import Imap from 'imap'
import { simpleParser } from 'mailparser'
import nodemailer from 'nodemailer'

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

interface Email {
  id: string
  accountId: string
  subject: string
  from: string
  to: string
  date: string
  content: string
  isRead: boolean
  isStarred: boolean
  uid?: number
}

// 默认账号配置
const defaultAccounts: EmailAccount[] = [
  {
    id: '1',
    email: '18@HH.email.cn',
    password: 'yuHKfnKvCqmw6HNN',
    imapServer: 'imap.email.cn',
    imapPort: 993,
    smtpServer: 'smtp.email.cn',
    smtpPort: 465,
    isActive: true
  },
  {
    id: '2',
    email: 'Steven@HH.email.cn',
    password: 'KftcWviBjFcgnwfJ',
    imapServer: 'imap.email.cn',
    imapPort: 993,
    smtpServer: 'smtp.email.cn',
    smtpPort: 465,
    isActive: true
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    
    // 如果指定了accountId，则获取该账号的邮件
    if (accountId) {
      const account = defaultAccounts.find(acc => acc.id === accountId)
      if (!account) {
        return NextResponse.json({ error: '账号不存在' }, { status: 404 })
      }
      
      try {
        const emails = await fetchEmailsFromServer(account)
        return NextResponse.json(emails)
      } catch (error) {
        console.error(`获取账号 ${accountId} 邮件失败:`, error)
        // 返回空数组而不是错误，让前端可以处理
        return NextResponse.json([])
      }
    }

    // 获取所有账号的邮件
    const allEmails: Email[] = []
    for (const account of defaultAccounts.filter(acc => acc.isActive)) {
      try {
        const emails = await fetchEmailsFromServer(account)
        allEmails.push(...emails)
      } catch (error) {
        console.error(`获取账号 ${account.email} 邮件失败:`, error)
        // 继续处理其他账号
      }
    }

    // 按日期排序
    allEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return NextResponse.json(allEmails)
  } catch (error) {
    console.error('获取邮件失败:', error)
    return NextResponse.json({ error: '获取邮件失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, account, email } = body

    if (action === 'fetchEmails') {
      // 连接到IMAP服务器获取邮件
      const emails = await fetchEmailsFromServer(account)
      return NextResponse.json(emails)
    }

    if (action === 'sendEmail') {
      // 发送邮件
      const result = await sendEmail(account, email)
      return NextResponse.json(result)
    }

    if (action === 'testConnection') {
      // 测试IMAP连接
      const result = await testImapConnection(account)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
  } catch (error) {
    console.error('邮件操作失败:', error)
    return NextResponse.json({ error: '邮件操作失败' }, { status: 500 })
  }
}

async function fetchEmailsFromServer(account: EmailAccount): Promise<Email[]> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: account.email,
      password: account.password,
      host: account.imapServer,
      port: account.imapPort,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      },
      connTimeout: 10000,
      authTimeout: 5000
    })

    const emails: Email[] = []

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          imap.end()
          return reject(err)
        }

        // 获取最近的20封邮件（包括已读和未读）
        imap.search(['ALL'], (err, results) => {
          if (err) {
            imap.end()
            return reject(err)
          }

          if (results.length === 0) {
            imap.end()
            return resolve([])
          }

          // 获取最近的20封邮件
          const recentUids = results.slice(-20)
          const fetch = imap.fetch(recentUids, {
            bodies: '',
            markSeen: false,
            struct: true
          })

          fetch.on('message', (msg, seqno) => {
            let buffer = ''
            let attributes: any

            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8')
              })
            })

            msg.once('attributes', (attrs) => {
              attributes = attrs
            })

            msg.once('end', () => {
              simpleParser(buffer, (err, parsed) => {
                if (err) {
                  console.error('解析邮件失败:', err)
                  return
                }

                const email: Email = {
                  id: attributes.uid.toString(),
                  accountId: account.id,
                  subject: parsed.subject || '无主题',
                  from: parsed.from?.text || '',
                  to: parsed.to?.text || '',
                  date: parsed.date?.toISOString() || new Date().toISOString(),
                  content: parsed.text || parsed.html || '',
                  isRead: attributes.flags.includes('\\Seen'),
                  isStarred: attributes.flags.includes('\\Flagged'),
                  uid: attributes.uid
                }

                emails.push(email)
              })
            })
          })

          fetch.once('error', (err) => {
            console.error('获取邮件失败:', err)
            imap.end()
            reject(err)
          })

          fetch.once('end', () => {
            // 等待一小段时间确保所有邮件解析完成
            setTimeout(() => {
              imap.end()
              resolve(emails)
            }, 1000) // 等待1秒确保所有邮件解析完成
          })
        })
      })
    })

    imap.once('error', (err) => {
      console.error('IMAP连接失败:', err)
      reject(err)
    })

    imap.once('end', () => {
      // 连接结束
    })

    imap.connect()
  })
}

async function sendEmail(account: EmailAccount, emailData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('开始发送邮件...', {
      from: account.email,
      to: emailData.to,
      subject: emailData.subject,
      smtpServer: account.smtpServer,
      smtpPort: account.smtpPort
    })

    const transporter = nodemailer.createTransport({
      host: account.smtpServer,
      port: account.smtpPort,
      secure: true,
      auth: {
        user: account.email,
        pass: account.password
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true,
      logger: true
    })

    const mailOptions = {
      from: account.email,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('邮件发送失败:', error)
        reject(error)
      } else {
        console.log('邮件发送成功:', info)
        resolve({
          success: true,
          messageId: info.messageId,
          response: info.response
        })
      }
    })
  })
}

async function testImapConnection(account: EmailAccount): Promise<any> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: account.email,
      password: account.password,
      host: account.imapServer,
      port: account.imapPort,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      },
      connTimeout: 10000,
      authTimeout: 5000
    })

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          imap.end()
          resolve({ success: false, error: err.message })
        } else {
          imap.end()
          resolve({ success: true, message: '连接成功' })
        }
      })
    })

    imap.once('error', (err) => {
      resolve({ success: false, error: err.message })
    })

    imap.connect()
  })
}