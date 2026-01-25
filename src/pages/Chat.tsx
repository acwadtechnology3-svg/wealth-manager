import { useState, useEffect, useRef, useMemo } from "react";
import { Send, Search, MoreVertical, Phone, Video, Paperclip, Smile } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees } from "@/hooks/queries/useProfiles";
import { useConversation, useSendMessage } from "@/hooks/queries/useMessages";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Chat() {
  const { user, profile } = useAuth();
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter out current user from employees list
  const contacts = useMemo(() => {
    return employees.filter(emp => emp.user_id !== user?.id);
  }, [employees, user?.id]);

  // Auto-select first contact
  useEffect(() => {
    if (contacts.length > 0 && !selectedContactId) {
      setSelectedContactId(contacts[0].user_id!);
    }
  }, [contacts, selectedContactId]);

  // Fetch conversation with selected contact (with realtime)
  const { data: conversationMessages = [], isLoading: loadingMessages } = useConversation(
    user?.id,
    selectedContactId || undefined,
    100
  );

  // Send message mutation
  const sendMessageMutation = useSendMessage();

  // Selected contact info
  const selectedContact = contacts.find(c => c.user_id === selectedContactId);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter((c) =>
      c.full_name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  // Handle send message
  const handleSendMessage = () => {
    if (!message.trim() || !selectedContactId || !user?.id) return;

    sendMessageMutation.mutate({
      sender_id: user.id,
      recipient_id: selectedContactId,
      message: message.trim(),
      is_group_message: false,
      is_read: false,
    });

    setMessage("");
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "h:mm a", { locale: ar });
    } catch {
      return "";
    }
  };

  // Loading state
  if (loadingEmployees) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-8rem)] rounded-xl border bg-card shadow-card overflow-hidden">
          <div className="w-80 border-l flex flex-col p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <div className="flex-1 flex flex-col">
            <Skeleton className="h-16 w-full" />
            <div className="flex-1" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  // No employees state
  if (contacts.length === 0) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-8rem)] rounded-xl border bg-card shadow-card overflow-hidden items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">لا يوجد موظفون للمحادثة</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-8rem)] rounded-xl border bg-card shadow-card overflow-hidden animate-slide-up">
        {/* Contacts Sidebar */}
        <div className="w-80 border-l flex flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث في المحادثات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Contacts List */}
          <ScrollArea className="flex-1">
            {filteredContacts.map((contact) => {
              const initials = contact.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || contact.email?.substring(0, 2).toUpperCase() || "??";

              return (
                <button
                  key={contact.user_id}
                  onClick={() => setSelectedContactId(contact.user_id!)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 border-b transition-colors text-right",
                    "hover:bg-muted/50",
                    selectedContactId === contact.user_id && "bg-muted"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {contact.is_active && (
                      <span className="absolute bottom-0 left-0 h-3 w-3 rounded-full bg-success border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">{contact.full_name || contact.email}</p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.department || "موظف"}
                    </p>
                  </div>
                </button>
              );
            })}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {selectedContact.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedContact.full_name || selectedContact.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedContact.is_active ? (
                        <span className="text-success">متصل الآن</span>
                      ) : (
                        "غير متصل"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" disabled>
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled>
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled>
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-3/4" />
                    ))}
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">لا توجد رسائل بعد. ابدأ المحادثة!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationMessages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isMe ? "justify-start" : "justify-end"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-muted rounded-bl-none"
                            )}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p
                              className={cn(
                                "text-xs mt-1",
                                isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}
                            >
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" disabled>
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="اكتب رسالتك..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button variant="ghost" size="icon" disabled>
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button
                    className="gradient-primary"
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">اختر محادثة للبدء</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
