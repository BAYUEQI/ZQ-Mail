"use client"

import { Button } from "@/components/ui/button"
import { Settings, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { Role, ROLES } from "@/lib/permissions"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EMAIL_CONFIG } from "@/config"

export function ConfigPanel() {
  const [defaultRole, setDefaultRole] = useState<string>("")
  const [emailDomains, setEmailDomains] = useState<string>("")
  const [adminContact, setAdminContact] = useState<string>("")
  const [maxEmails, setMaxEmails] = useState<string>(EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString())
  const [loading, setLoading] = useState(false)
  const [newDomain, setNewDomain] = useState("")
  const { toast } = useToast()

  // 解析邮箱域名字符串为数组
  const emailDomainsArray = emailDomains ? emailDomains.split(',').map(d => d.trim()).filter(d => d) : []

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    const res = await fetch("/api/config")
    if (res.ok) {
      const data = await res.json() as { 
        defaultRole: Exclude<Role, typeof ROLES.EMPEROR>,
        emailDomains: string,
        adminContact: string,
        maxEmails: string
      }
      setDefaultRole(data.defaultRole)
      setEmailDomains(data.emailDomains)
      setAdminContact(data.adminContact)
      setMaxEmails(data.maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString())
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          defaultRole, 
          emailDomains,
          adminContact,
          maxEmails: maxEmails || EMAIL_CONFIG.MAX_ACTIVE_EMAILS.toString()
        }),
      })

      if (!res.ok) throw new Error("保存失败")

      toast({
        title: "保存成功",
        description: "网站设置已更新",
      })
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addDomain = () => {
    if (!newDomain.trim()) {
      toast({
        title: "错误",
        description: "请输入域名",
        variant: "destructive",
      })
      return
    }

    if (emailDomainsArray.includes(newDomain.trim())) {
      toast({
        title: "错误",
        description: "该域名已存在",
        variant: "destructive",
      })
      return
    }

    const newDomainsArray = [...emailDomainsArray, newDomain.trim()]
    const updatedDomains = newDomainsArray.join(',')
    setEmailDomains(updatedDomains)
    setNewDomain("")
    
    toast({
      title: "成功",
      description: "域名已添加",
    })
  }

  const removeDomain = (domainToRemove: string) => {
    const updatedDomainsArray = emailDomainsArray.filter(d => d !== domainToRemove)
    const updatedDomains = updatedDomainsArray.join(',')
    setEmailDomains(updatedDomains)
    
    toast({
      title: "成功",
      description: "域名已删除",
    })
  }

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">网站设置</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm">新用户默认角色:</span>
          <Select value={defaultRole} onValueChange={setDefaultRole}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROLES.DUKE}>公爵</SelectItem>
              <SelectItem value={ROLES.KNIGHT}>骑士</SelectItem>
              <SelectItem value={ROLES.CIVILIAN}>平民</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-sm">邮箱域名管理:</span>
            <div className="flex-1 flex gap-2">
              <Input 
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="输入新域名，如: example.com"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addDomain()}
              />
              <Button 
                onClick={addDomain}
                size="sm"
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                添加
              </Button>
            </div>
          </div>

          {emailDomainsArray.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">当前配置的域名:</span>
              <div className="space-y-1">
                {emailDomainsArray.map((domain, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="flex-1 text-sm">@{domain}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDomain(domain)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm">管理员联系方式:</span>
          <div className="flex-1">
            <Input 
              value={adminContact}
              onChange={(e) => setAdminContact(e.target.value)}
              placeholder="如: 微信号、邮箱等"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm">最大邮箱数量:</span>
          <div className="flex-1">
            <Input 
              type="number"
              min="1"
              max="100"
              value={maxEmails}
              onChange={(e) => setMaxEmails(e.target.value)}
              placeholder={`默认为 ${EMAIL_CONFIG.MAX_ACTIVE_EMAILS}`}
            />
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          保存
        </Button>
      </div>
    </div>
  )
} 
