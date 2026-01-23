import { useState } from "react";
import { Send, Search, MoreVertical, Phone, Video, Paperclip, Smile } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const contacts = [
  { id: 1, name: "سارة أحمد", role: "مدير مبيعات", online: true, lastMessage: "تم إضافة العميل الجديد", time: "10:30 ص", unread: 2 },
  { id: 2, name: "خالد محمود", role: "تيلي سيلز", online: true, lastMessage: "شكراً على المتابعة", time: "9:45 ص", unread: 0 },
  { id: 3, name: "محمد علي", role: "تيلي سيلز", online: false, lastMessage: "سأرسل التقرير غداً", time: "أمس", unread: 0 },
  { id: 4, name: "نورا حسين", role: "محاسب", online: true, lastMessage: "تم تحويل العمولات", time: "أمس", unread: 1 },
  { id: 5, name: "الإدارة", role: "مجموعة", online: true, lastMessage: "اجتماع الساعة 2 ظهراً", time: "الإثنين", unread: 5 },
];

const messages = [
  { id: 1, sender: "سارة أحمد", content: "صباح الخير! هل تم مراجعة ملف العميل الجديد؟", time: "9:00 ص", isMe: false },
  { id: 2, sender: "أنا", content: "صباح النور سارة. نعم، تم المراجعة وكل شيء سليم.", time: "9:05 ص", isMe: true },
  { id: 3, sender: "سارة أحمد", content: "ممتاز! العميل مستثمر بمبلغ 200,000 جنيه بنسبة ربح 12%", time: "9:10 ص", isMe: false },
  { id: 4, sender: "أنا", content: "تمام، سأضيفه للنظام الآن وأحدد موعد أول صرف أرباح", time: "9:15 ص", isMe: true },
  { id: 5, sender: "سارة أحمد", content: "شكراً لك. أيضاً لدي عميل آخر محتمل سأرسل بياناته لاحقاً", time: "9:20 ص", isMe: false },
  { id: 6, sender: "أنا", content: "تمام، أنا في الانتظار", time: "9:25 ص", isMe: true },
  { id: 7, sender: "سارة أحمد", content: "تم إضافة العميل الجديد", time: "10:30 ص", isMe: false },
];

export default function Chat() {
  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter((c) =>
    c.name.includes(searchQuery)
  );

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
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 border-b transition-colors text-right",
                  "hover:bg-muted/50",
                  selectedContact.id === contact.id && "bg-muted"
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {contact.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  {contact.online && (
                    <span className="absolute bottom-0 left-0 h-3 w-3 rounded-full bg-success border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">{contact.name}</p>
                    <span className="text-xs text-muted-foreground">{contact.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                    {contact.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {selectedContact.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedContact.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedContact.online ? (
                    <span className="text-success">متصل الآن</span>
                  ) : (
                    "غير متصل"
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.isMe ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2",
                      msg.isMe
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-bl-none"
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        msg.isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="اكتب رسالتك..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Smile className="h-5 w-5" />
              </Button>
              <Button className="gradient-primary" size="icon">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
