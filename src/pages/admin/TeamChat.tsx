import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Search, User, Clock, Filter, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface TeamMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  message: string;
  is_group_message: boolean;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    first_name: string;
    last_name: string;
    department: string;
  };
  recipient_profile?: {
    first_name: string;
    last_name: string;
  };
}

interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  department: string;
}

const TeamChat = () => {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [senderFilter, setSenderFilter] = useState<string>("all");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();

    // Subscribe to realtime messages
    const channel = supabase
      .channel("team_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_messages",
        },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all profiles first
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, department");

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("team_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (messagesError) throw messagesError;

      const messagesWithProfiles = (messagesData || []).map((msg) => ({
        ...msg,
        sender_profile: profilesData?.find((p) => p.user_id === msg.sender_id),
        recipient_profile: msg.recipient_id
          ? profilesData?.find((p) => p.user_id === msg.recipient_id)
          : null,
      }));

      setMessages(messagesWithProfiles as TeamMessage[]);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الرسائل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.sender_profile?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.sender_profile?.last_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSender = senderFilter === "all" || msg.sender_id === senderFilter;
    return matchesSearch && matchesSender;
  });

  const groupMessagesByDate = (msgs: TeamMessage[]) => {
    const groups: Record<string, TeamMessage[]> = {};
    msgs.forEach((msg) => {
      const date = format(new Date(msg.created_at), "yyyy-MM-dd");
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(filteredMessages);

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "admin": return "bg-red-100 text-red-800";
      case "hr": return "bg-blue-100 text-blue-800";
      case "tele_sales": return "bg-green-100 text-green-800";
      case "finance": return "bg-purple-100 text-purple-800";
      case "support": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDepartmentLabel = (department: string) => {
    switch (department) {
      case "admin": return "الإدارة";
      case "hr": return "HR";
      case "tele_sales": return "المبيعات";
      case "finance": return "المالية";
      case "support": return "الدعم";
      default: return department;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">شات الفريق</h1>
          <p className="text-muted-foreground">مراقبة جميع المحادثات بين أعضاء الفريق</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الرسائل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messages.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">رسائل اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {messages.filter((m) => new Date(m.created_at).toDateString() === new Date().toDateString()).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">رسائل جماعية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {messages.filter((m) => m.is_group_message).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">رسائل خاصة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {messages.filter((m) => !m.is_group_message).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الرسائل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={senderFilter} onValueChange={setSenderFilter}>
                <SelectTrigger className="w-full md:w-64">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="كل المرسلين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المرسلين</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      {profile.first_name} {profile.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              المحادثات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد رسائل
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {Object.entries(messageGroups).map(([date, msgs]) => (
                    <div key={date}>
                      <div className="sticky top-0 bg-background py-2 z-10">
                        <div className="flex items-center justify-center">
                          <Badge variant="outline" className="bg-muted">
                            {format(new Date(date), "EEEE dd MMMM yyyy", { locale: ar })}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {msgs.map((msg) => (
                          <div
                            key={msg.id}
                            className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">
                                      {msg.sender_profile?.first_name} {msg.sender_profile?.last_name}
                                    </span>
                                    <Badge className={getDepartmentColor(msg.sender_profile?.department || "")}>
                                      {getDepartmentLabel(msg.sender_profile?.department || "")}
                                    </Badge>
                                    {msg.is_group_message ? (
                                      <Badge variant="outline">رسالة جماعية</Badge>
                                    ) : msg.recipient_profile ? (
                                      <Badge variant="outline">
                                        إلى: {msg.recipient_profile.first_name} {msg.recipient_profile.last_name}
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p className="mt-2 text-sm">{msg.message}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                <Clock className="h-3 w-3" />
                                {format(new Date(msg.created_at), "HH:mm", { locale: ar })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default TeamChat;
