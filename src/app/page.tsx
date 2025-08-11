'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Mail, Plus, Settings, RefreshCw, Inbox, Send, Star, Trash2, Eye, Edit, Power, PowerOff, Filter } from 'lucide-react'

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
}

export default function Home() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showComposeEmail, setShowComposeEmail] = useState(false)
  const [newAccount, setNewAccount] = useState({
    email: '',
    password: '',
    imapServer: 'imap.email.cn',
    imapPort: 993,
    smtpServer: 'smtp.email.cn',
    smtpPort: 465
  })
  const [composeEmail, setComposeEmail] = useState({
    from: '',
    to: '',
    subject: '',
    content: ''
  })

  // 添加默认账号
  useEffect(() => {
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
    setAccounts(defaultAccounts)
  }, [])

  const addAccount = async () => {
    if (newAccount.email && newAccount.password) {
      try {
        // 通过API添加账号
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'add',
            account: newAccount
          })
        })

        if (response.ok) {
          const addedAccount = await response.json()
          setAccounts([...accounts, addedAccount])
          setNewAccount({
            email: '',
            password: '',
            imapServer: 'imap.email.cn',
            imapPort: 993,
            smtpServer: 'smtp.email.cn',
            smtpPort: 465
          })
          setShowAddAccount(false)
        } else {
          console.error('添加账号失败:', response.statusText)
          // 如果API失败，仍然在前端添加（模拟）
          const account: EmailAccount = {
            id: Date.now().toString(),
            ...newAccount,
            isActive: true
          }
          setAccounts([...accounts, account])
          setNewAccount({
            email: '',
            password: '',
            imapServer: 'imap.email.cn',
            imapPort: 993,
            smtpServer: 'smtp.email.cn',
            smtpPort: 465
          })
          setShowAddAccount(false)
        }
      } catch (error) {
        console.error('添加账号失败:', error)
        // 如果API失败，仍然在前端添加（模拟）
        const account: EmailAccount = {
          id: Date.now().toString(),
          ...newAccount,
          isActive: true
        }
        setAccounts([...accounts, account])
        setNewAccount({
          email: '',
          password: '',
          imapServer: 'imap.email.cn',
          imapPort: 993,
          smtpServer: 'smtp.email.cn',
          smtpPort: 465
        })
        setShowAddAccount(false)
      }
    }
  }

  const fetchEmails = async (accountId?: string) => {
    setIsLoading(true)
    try {
      // 从API获取邮件数据
      const url = accountId && accountId !== 'all' ? `/api/email?accountId=${accountId}` : '/api/email'
      const response = await fetch(url)
      if (response.ok) {
        const emailData = await response.json()
        setEmails(emailData)
      } else {
        console.error('获取邮件失败:', response.statusText)
        setEmails([])
      }
    } catch (error) {
      console.error('获取邮件失败:', error)
      setEmails([])
    } finally {
      setIsLoading(false)
    }
  }

  const sendEmail = async () => {
    if (!composeEmail.to || !composeEmail.subject) {
      alert('请填写收件人和主题')
      return
    }

    try {
      // 使用指定的发送账号
      const senderAccount = accounts.find(acc => acc.email === composeEmail.from)
      if (!senderAccount) {
        alert('请选择发送账号')
        return
      }

      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendEmail',
          account: senderAccount,
          email: {
            to: composeEmail.to,
            subject: composeEmail.subject,
            text: composeEmail.content,
            html: composeEmail.content.replace(/\n/g, '<br>')
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          alert('邮件发送成功')
          setShowComposeEmail(false)
          setComposeEmail({ from: '', to: '', subject: '', content: '' })
          // 刷新邮件列表
          fetchEmails(selectedAccountId)
        } else {
          alert('邮件发送失败')
        }
      } else {
        const errorData = await response.json()
        alert(`邮件发送失败: ${errorData.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('发送邮件失败:', error)
      alert(`发送邮件失败: ${error.message || '网络错误'}`)
    }
  }

  const testConnection = async (accountId: string) => {
    try {
      const account = accounts.find(acc => acc.id === accountId)
      if (!account) return

      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'testConnection',
          account: account
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          alert('连接测试成功')
        } else {
          alert(`连接测试失败: ${result.error}`)
        }
      } else {
        alert('连接测试失败')
      }
    } catch (error) {
      console.error('连接测试失败:', error)
      alert('连接测试失败')
    }
  }

  const syncAccountEmails = async (accountId: string) => {
    try {
      const account = accounts.find(acc => acc.id === accountId)
      if (account && account.isActive) {
        await fetchEmails(accountId)
      }
    } catch (error) {
      console.error('同步账号邮件失败:', error)
    }
  }

  const syncAllEmails = async () => {
    const activeAccounts = accounts.filter(acc => acc.isActive)
    for (const account of activeAccounts) {
      await syncAccountEmails(account.id)
    }
  }

  useEffect(() => {
    if (accounts.length > 0) {
      fetchEmails(selectedAccountId)
    }
  }, [accounts, selectedAccountId])

  // 自动同步邮件 - 每5分钟同步一次
  useEffect(() => {
    const interval = setInterval(() => {
      if (accounts.length > 0) {
        syncAllEmails()
      }
    }, 5 * 60 * 1000) // 5分钟

    return () => clearInterval(interval)
  }, [accounts])

  const toggleStar = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
    ))
  }

  const markAsRead = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, isRead: true } : email
    ))
  }

  const getAccountEmail = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId)?.email || ''
  }

  const toggleAccountStatus = async (accountId: string) => {
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggleActive',
          account: { id: accountId }
        })
      })

      if (response.ok) {
        const updatedAccount = await response.json()
        setAccounts(accounts.map(acc => 
          acc.id === accountId ? updatedAccount : acc
        ))
      } else {
        console.error('切换账号状态失败:', response.statusText)
        // 前端模拟
        setAccounts(accounts.map(acc => 
          acc.id === accountId ? { ...acc, isActive: !acc.isActive } : acc
        ))
      }
    } catch (error) {
      console.error('切换账号状态失败:', error)
      // 前端模拟
      setAccounts(accounts.map(acc => 
        acc.id === accountId ? { ...acc, isActive: !acc.isActive } : acc
      ))
    }
  }

  const deleteAccount = async (accountId: string) => {
    if (confirm('确定要删除这个账号吗？')) {
      try {
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete',
            account: { id: accountId }
          })
        })

        if (response.ok) {
          setAccounts(accounts.filter(acc => acc.id !== accountId))
          // 同时删除该账号的邮件
          setEmails(emails.filter(email => email.accountId !== accountId))
          if (selectedEmail?.accountId === accountId) {
            setSelectedEmail(null)
          }
        } else {
          console.error('删除账号失败:', response.statusText)
          // 前端模拟
          setAccounts(accounts.filter(acc => acc.id !== accountId))
          setEmails(emails.filter(email => email.accountId !== accountId))
          if (selectedEmail?.accountId === accountId) {
            setSelectedEmail(null)
          }
        }
      } catch (error) {
        console.error('删除账号失败:', error)
        // 前端模拟
        setAccounts(accounts.filter(acc => acc.id !== accountId))
        setEmails(emails.filter(email => email.accountId !== accountId))
        if (selectedEmail?.accountId === accountId) {
          setSelectedEmail(null)
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">邮件客户端</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background min-w-48"
              >
                <option value="all">📥 所有账号收件箱</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.isActive ? '🟢' : '🔴'} {account.email}
                  </option>
                ))}
              </select>
              {selectedAccountId !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  {accounts.find(acc => acc.id === selectedAccountId)?.email}
                </Badge>
              )}
            </div>
            <Button onClick={syncAllEmails} disabled={isLoading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              刷新全部
            </Button>
            <Dialog open={showComposeEmail} onOpenChange={setShowComposeEmail}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  写邮件
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>撰写新邮件</DialogTitle>
                  <DialogDescription>
                    发送新邮件
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="from">发件人</Label>
                    <select
                      id="from"
                      value={composeEmail.from}
                      onChange={(e) => setComposeEmail({ ...composeEmail, from: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">📤 选择发件账号</option>
                      {accounts.filter(acc => acc.isActive).map(account => (
                        <option key={account.id} value={account.email}>
                          📧 {account.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="to">收件人</Label>
                    <Input
                      id="to"
                      value={composeEmail.to}
                      onChange={(e) => setComposeEmail({ ...composeEmail, to: e.target.value })}
                      placeholder="example@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">主题</Label>
                    <Input
                      id="subject"
                      value={composeEmail.subject}
                      onChange={(e) => setComposeEmail({ ...composeEmail, subject: e.target.value })}
                      placeholder="邮件主题"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">内容</Label>
                    <textarea
                      id="content"
                      value={composeEmail.content}
                      onChange={(e) => setComposeEmail({ ...composeEmail, content: e.target.value })}
                      placeholder="邮件内容"
                      className="w-full h-32 px-3 py-2 border rounded-md resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={sendEmail} className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      发送
                    </Button>
                    <Button variant="outline" onClick={() => setShowComposeEmail(false)}>
                      取消
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加账号
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加邮件账号</DialogTitle>
                  <DialogDescription>
                    配置您的邮件账号信息
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">邮箱地址</Label>
                    <Input
                      id="email"
                      value={newAccount.email}
                      onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                      placeholder="example@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">密码</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newAccount.password}
                      onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                      placeholder="输入密码"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="imapServer">IMAP服务器</Label>
                      <Input
                        id="imapServer"
                        value={newAccount.imapServer}
                        onChange={(e) => setNewAccount({ ...newAccount, imapServer: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="imapPort">IMAP端口</Label>
                      <Input
                        id="imapPort"
                        type="number"
                        value={newAccount.imapPort}
                        onChange={(e) => setNewAccount({ ...newAccount, imapPort: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpServer">SMTP服务器</Label>
                      <Input
                        id="smtpServer"
                        value={newAccount.smtpServer}
                        onChange={(e) => setNewAccount({ ...newAccount, smtpServer: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">SMTP端口</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={newAccount.smtpPort}
                        onChange={(e) => setNewAccount({ ...newAccount, smtpPort: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button onClick={addAccount} className="w-full">
                    添加账号
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 账号列表 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                邮件账号
              </CardTitle>
              <CardDescription>
                管理您的邮件账号
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{account.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={account.isActive ? "default" : "secondary"} className="text-xs">
                            {account.isActive ? "🟢 活跃" : "🔴 未激活"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3 space-y-1">
                        <div>📥 IMAP: {account.imapServer}:{account.imapPort}</div>
                        <div>📤 SMTP: {account.smtpServer}:{account.smtpPort}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnection(account.id)}
                          disabled={isLoading}
                          className="text-xs h-7 px-2"
                        >
                          🔗 测试
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAccountId(account.id)
                            syncAccountEmails(account.id)
                          }}
                          disabled={isLoading}
                          className="text-xs h-7 px-2"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAccountStatus(account.id)}
                          className="text-xs h-7 px-2 flex-1"
                        >
                          {account.isActive ? (
                            <>
                              <PowerOff className="h-3 w-3 mr-1" />
                              禁用
                            </>
                          ) : (
                            <>
                              <Power className="h-3 w-3 mr-1" />
                              启用
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteAccount(account.id)}
                          className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 邮件列表 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                收件箱
                {selectedAccountId !== 'all' && (
                  <Badge variant="secondary" className="text-sm">
                    📧 {accounts.find(acc => acc.id === selectedAccountId)?.email}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {selectedAccountId === 'all' ? 
                  '📥 显示所有活跃账号的邮件' : 
                  `📧 仅显示 ${accounts.find(acc => acc.id === selectedAccountId)?.email} 的邮件`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2 mb-2" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {emails.map((email) => (
                      <div
                        key={email.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                          !email.isRead ? 'bg-accent/50' : ''
                        } ${selectedEmail?.id === email.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => {
                          setSelectedEmail(email)
                          markAsRead(email.id)
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{email.from}</span>
                              <Badge variant="outline" className="text-xs">
                                {getAccountEmail(email.accountId)}
                              </Badge>
                              {!email.isRead && (
                                <Badge variant="default" className="text-xs">
                                  未读
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm font-medium mb-1">{email.subject}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {email.content.substring(0, 100)}...
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-xs text-muted-foreground">
                              {email.date}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleStar(email.id)
                              }}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 邮件详情 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                邮件详情
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEmail ? (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedEmail.subject}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>来自: {selectedEmail.from}</span>
                        <Badge variant="outline" className="text-xs">
                          {getAccountEmail(selectedEmail.accountId)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        发送至: {selectedEmail.to}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        时间: {selectedEmail.date}
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="prose prose-sm max-w-none">
                        {selectedEmail.content}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                      <Button size="sm" variant="outline" onClick={() => {
                        setShowComposeEmail(true)
                        setComposeEmail({
                          to: selectedEmail.from,
                          subject: `Re: ${selectedEmail.subject}`,
                          content: `\n\n--- 原始邮件 ---\n${selectedEmail.content}`
                        })
                      }}>
                        <Send className="h-4 w-4 mr-2" />
                        回复
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setShowComposeEmail(true)
                        setComposeEmail({
                          to: '',
                          subject: `Fwd: ${selectedEmail.subject}`,
                          content: `\n\n--- 转发邮件 ---\n发件人: ${selectedEmail.from}\n主题: ${selectedEmail.subject}\n\n${selectedEmail.content}`
                        })
                      }}>
                        <Send className="h-4 w-4 mr-2" />
                        转发
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>选择一封邮件查看详情</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 测试邮件收发区域 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                邮件收发测试
              </CardTitle>
              <CardDescription>
                使用两个账号相互发送测试邮件，验证邮件收发功能正常
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label>发送账号</Label>
                    <select 
                      value={composeEmail.from || ''}
                      onChange={(e) => setComposeEmail({...composeEmail, from: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">📤 选择发送账号</option>
                      {accounts.filter(acc => acc.isActive).map(account => (
                        <option key={account.id} value={account.email}>
                          📧 {account.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>接收账号</Label>
                    <select 
                      value={composeEmail.to}
                      onChange={(e) => setComposeEmail({...composeEmail, to: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">📥 选择接收账号</option>
                      {accounts.filter(acc => acc.isActive).map(account => (
                        <option key={account.id} value={account.email}>
                          📧 {account.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>测试主题</Label>
                    <Input
                      value={composeEmail.subject}
                      onChange={(e) => setComposeEmail({...composeEmail, subject: e.target.value})}
                      placeholder="邮件测试主题"
                    />
                  </div>
                  <div>
                    <Label>测试内容</Label>
                    <textarea
                      value={composeEmail.content}
                      onChange={(e) => setComposeEmail({...composeEmail, content: e.target.value})}
                      placeholder="这是一封测试邮件，用于验证邮件收发功能是否正常。"
                      className="w-full h-24 px-3 py-2 border rounded-md resize-none"
                    />
                  </div>
                  <Button onClick={sendEmail} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    📤 发送测试邮件
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">测试说明</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• 选择两个不同的账号进行测试</p>
                      <p>• 发送后点击"刷新全部"查看接收到的邮件</p>
                      <p>• 可以使用账号筛选器查看特定账号的邮件</p>
                      <p>• 测试前可以先点击"测试连接"验证账号配置</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">快速测试</h4>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const activeAccounts = accounts.filter(acc => acc.isActive)
                        if (activeAccounts.length >= 2) {
                          setComposeEmail({
                            from: activeAccounts[0].email,
                            to: activeAccounts[1].email,
                            subject: '邮件收发测试',
                            content: '这是一封测试邮件，用于验证邮件收发功能是否正常。发送时间：' + new Date().toLocaleString()
                          })
                        } else {
                          alert('需要至少两个活跃账号才能进行测试')
                        }
                      }}
                      className="w-full"
                    >
                      自动填充测试账号
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}