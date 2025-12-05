import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, MessageCircle, Video, FileText, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About ChitChat
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            A safe, anonymous platform for college students to connect, chat, and make new friends through video and text conversations.
          </p>
        </div>

        {/* Mission */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg text-muted-foreground leading-relaxed">
                ChitChat was created to help college students connect with peers in a safe, anonymous environment. 
                We believe that meaningful conversations can happen when people feel comfortable being themselves, 
                without the pressure of revealing personal information upfront.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>College Students Only</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect exclusively with verified college students. Our platform is designed for the academic community.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Safe & Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI-powered content moderation, easy reporting system, and strict privacy controls keep conversations safe.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageCircle className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Anonymous Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chat with random students without revealing your identity. Your privacy is our priority.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Video className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Video Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Start video calls with your matches for face-to-face conversations. Built-in screen sharing available.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>File Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Share images and documents securely through Google Drive integration. Perfect for study groups.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Heart className="h-12 w-12 text-pink-600 mb-4" />
              <CardTitle>Make Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Build meaningful connections with fellow students. Find study partners, roommates, or lifelong friends.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Safety */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Safety First</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Content Moderation</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• AI-powered text and image scanning</li>
                    <li>• Automatic flagging of inappropriate content</li>
                    <li>• Real-time content monitoring</li>
                    <li>• Community reporting system</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">Privacy Protection</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Anonymous usernames only</li>
                    <li>• No personal information required</li>
                    <li>• Secure data encryption</li>
                    <li>• GDPR compliant data handling</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technology */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Built with Modern Technology</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Frontend</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Next.js 14</Badge>
                    <Badge>React</Badge>
                    <Badge>TypeScript</Badge>
                    <Badge>Tailwind CSS</Badge>
                    <Badge>shadcn/ui</Badge>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">Backend</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Supabase</Badge>
                    <Badge>PostgreSQL</Badge>
                    <Badge>Real-time</Badge>
                    <Badge>Google Drive</Badge>
                    <Badge>Jitsi Meet</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-muted-foreground">
          <p>© 2024 ChitChat. Built for college students, by college students.</p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="/terms" className="hover:underline">Terms of Service</a>
            <a href="/privacy" className="hover:underline">Privacy Policy</a>
            <a href="/contact" className="hover:underline">Contact</a>
          </div>
        </div>
      </div>
    </div>
  )
}

