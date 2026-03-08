"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { checkUserRole } from "@/lib/checkAuth"
import { auth } from "@/lib/firebaseConfig"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import Image from "next/image"
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Mail,
  Building,
  GraduationCap,
  Lock,
  Loader2,
} from "lucide-react"

const LOCAL_AVATARS = [
  { id: "avatar1", path: "/avatars/avatar1.png" },
  { id: "avatar2", path: "/avatars/avatar2.png" },
  { id: "avatar3", path: "/avatars/avatar3.png" },
  { id: "avatar4", path: "/avatars/avatar4.png" },
  { id: "avatar5", path: "/avatars/avatar5.png" },
  { id: "avatar6", path: "/avatars/avatar6.png" },
]

interface UserData {
  email: string
  role: string
  name?: string
  school_id?: string
  avatarSeed?: number
  group_id?: string
}

// Settings section card component
function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  accentColor,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
  accentColor: string
}) {
  return (
    <Card className="bg-card border border-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${accentColor}`}>
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}

export default function StudentSettings() {
  checkUserRole(["admin", "instructor", "student"])
  
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [messageNotifications, setMessageNotifications] = useState(true)
  const [progressNotifications, setProgressNotifications] = useState(true)
  const [teamNotifications, setTeamNotifications] = useState(true)
  
  // Avatar state
  const [avatarSeed, setAvatarSeed] = useState(1)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      setUserData(parsed)
      setAvatarSeed(parsed.avatarSeed || 1)
    }
    setLoading(false)
  }, [])

  const handleAvatarChange = async (index: number) => {
    try {
      const newSeed = index + 1
      setAvatarSeed(newSeed)
      setShowAvatarPicker(false)

      const user = auth.currentUser
      if (user) {
        const token = await user.getIdToken()
        const response = await fetch("http://localhost:8080/user/avatar", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ avatarSeed: newSeed }),
        })

        if (response.ok) {
          const updatedUser = { ...userData, avatarSeed: newSeed }
          localStorage.setItem("user", JSON.stringify(updatedUser))
          setUserData(updatedUser as UserData)
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 3000)
        }
      }
    } catch (error) {
      console.error("Failed to update avatar:", error)
      setError("Failed to update avatar")
      setTimeout(() => setError(null), 3000)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError(null)
    setPasswordSuccess(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }

    setChangingPassword(true)

    try {
      const user = auth.currentUser
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        await reauthenticateWithCredential(user, credential)
        await updatePassword(user, newPassword)
        
        setPasswordSuccess(true)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setPasswordSuccess(false), 3000)
      }
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect")
      } else if (error.code === "auth/weak-password") {
        setPasswordError("Password is too weak")
      } else {
        setPasswordError("Failed to change password. Please try again.")
      }
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    // Simulate API call for notification preferences
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaveSuccess(true)
    setSaving(false)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  if (loading) {
    return (
      <DashboardLayout userType="student">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const avatarPath = LOCAL_AVATARS[(avatarSeed || 1) - 1]?.path || LOCAL_AVATARS[0].path

  return (
    <DashboardLayout userType="student">
      <div className="space-y-8 p-6 md:p-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences and settings</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">Settings saved successfully</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Avatar Section */}
            <SettingsCard
              icon={Palette}
              title="Profile Picture"
              description="Choose an avatar to represent you"
              accentColor="from-violet-500/20 to-purple-500/10"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden ring-4 ring-border/50">
                      <Image
                        src={avatarPath}
                        alt="Current Avatar"
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <Badge className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs">
                      Current
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="rounded-xl"
                  >
                    Change Avatar
                  </Button>
                </div>

                {showAvatarPicker && (
                  <div className="grid grid-cols-6 gap-3 p-4 rounded-xl bg-secondary/30 border border-border">
                    {LOCAL_AVATARS.map((avatar, index) => (
                      <button
                        key={avatar.id}
                        onClick={() => handleAvatarChange(index)}
                        className={`relative h-14 w-14 rounded-xl overflow-hidden ring-2 transition-all hover:scale-105 ${
                          avatarSeed === index + 1
                            ? "ring-primary ring-offset-2 ring-offset-background"
                            : "ring-border/50 hover:ring-primary/50"
                        }`}
                      >
                        <Image
                          src={avatar.path}
                          alt={`Avatar ${index + 1}`}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                        {avatarSeed === index + 1 && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </SettingsCard>

            {/* Account Information */}
            <SettingsCard
              icon={User}
              title="Account Information"
              description="Your personal account details"
              accentColor="from-blue-500/20 to-cyan-500/10"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    value={userData?.email || ""}
                    disabled
                    className="rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Role
                  </Label>
                  <Input
                    value={userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : ""}
                    disabled
                    className="rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    School ID
                  </Label>
                  <Input
                    value={userData?.school_id || "Not assigned"}
                    disabled
                    className="rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Name
                  </Label>
                  <Input
                    value={userData?.name || "Not set"}
                    disabled
                    className="rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
              </div>
            </SettingsCard>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <SettingsCard
              icon={Bell}
              title="Notification Preferences"
              description="Choose what notifications you want to receive"
              accentColor="from-amber-500/20 to-orange-500/10"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Message Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified when you receive new messages</p>
                  </div>
                  <Switch
                    checked={messageNotifications}
                    onCheckedChange={setMessageNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Progress Updates</p>
                    <p className="text-sm text-muted-foreground">Notifications about your learning progress</p>
                  </div>
                  <Switch
                    checked={progressNotifications}
                    onCheckedChange={setProgressNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Team Activity</p>
                    <p className="text-sm text-muted-foreground">Updates about your team members activity</p>
                  </div>
                  <Switch
                    checked={teamNotifications}
                    onCheckedChange={setTeamNotifications}
                  />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="rounded-xl bg-primary hover:bg-primary/90"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </SettingsCard>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <SettingsCard
              icon={Lock}
              title="Change Password"
              description="Update your account password"
              accentColor="from-red-500/20 to-rose-500/10"
            >
              <div className="space-y-6">
                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium">Password changed successfully</span>
                  </div>
                )}
                {passwordError && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{passwordError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={changingPassword}
                    className="rounded-xl bg-primary hover:bg-primary/90"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </SettingsCard>

            {/* Security Info */}
            <SettingsCard
              icon={Shield}
              title="Security Information"
              description="Your account security status"
              accentColor="from-emerald-500/20 to-teal-500/10"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Email Verified</p>
                      <p className="text-sm text-muted-foreground">Your email address is verified</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                    Verified
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Password</p>
                      <p className="text-sm text-muted-foreground">Last changed: Unknown</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-border">
                    Active
                  </Badge>
                </div>
              </div>
            </SettingsCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
