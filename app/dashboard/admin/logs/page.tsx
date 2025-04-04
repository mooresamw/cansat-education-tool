"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { ChevronDown, ChevronUp, Download, ArrowLeftCircle } from "lucide-react";

export default function LogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState({ email: "", startDate: "", role: "", action: "" });
  const [logsLoading, setLogsLoading] = useState(false);
  const [clockLogs, setClockLogs] = useState<any[]>([]);
  const [filteredClockLogs, setFilteredClockLogs] = useState<any[]>([]);
  const [clockLogFilter, setClockLogFilter] = useState({ name: "", startDate: "" });
  const [clockLogsLoading, setClockLogsLoading] = useState(false);
  const [clockLogsError, setClockLogsError] = useState<string | null>(null);
  const [messageLogs, setMessageLogs] = useState<any[]>([]);
  const [filteredMessageLogs, setFilteredMessageLogs] = useState<any[]>([]);
  const [messageLogFilter, setMessageLogFilter] = useState({ sender: "", content: "" });
  const [messageLogsLoading, setMessageLogsLoading] = useState(false);
  const [messageLogsError, setMessageLogsError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState({ activity: 1, chat: 1, clock: 1 });
  const itemsPerPage = 10;

  // Load cached data from localStorage
  const loadCachedData = () => {
    if (typeof window === "undefined") return;
    const cachedLogs = localStorage.getItem("activityLogs");
    const cachedClockLogs = localStorage.getItem("clockLogs");
    const cachedMessageLogs = localStorage.getItem("messageLogs");

    if (cachedLogs) {
      const parsedLogs = JSON.parse(cachedLogs);
      setLogs(parsedLogs);
      setFilteredLogs(parsedLogs);
    }
    if (cachedClockLogs) {
      const parsedClockLogs = JSON.parse(cachedClockLogs);
      setClockLogs(parsedClockLogs);
      setFilteredClockLogs(parsedClockLogs);
    }
    if (cachedMessageLogs) {
      const parsedMessageLogs = JSON.parse(cachedMessageLogs);
      setMessageLogs(parsedMessageLogs);
      setFilteredMessageLogs(parsedMessageLogs);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const logsQuery = query(collection(db, "logs"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(logsQuery);
      if (snapshot.empty) {
        setLogs([]);
        setFilteredLogs([]);
        localStorage.setItem("activityLogs", JSON.stringify([]));
        return;
      }
      const logList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(logList);
      setFilteredLogs(logList);
      if (typeof window !== "undefined") {
        localStorage.setItem("activityLogs", JSON.stringify(logList));
      }
    } catch (error) {
      console.error("Error fetching logs from Firestore:", error);
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchClockLogs = async () => {
    setClockLogsLoading(true);
    setClockLogsError(null);
    try {
      const clockLogsQuery = query(collection(db, "clock_logs"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(clockLogsQuery);
      if (snapshot.empty) {
        setClockLogs([]);
        setFilteredClockLogs([]);
        localStorage.setItem("clockLogs", JSON.stringify([]));
        return;
      }
      const clockLogList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClockLogs(clockLogList);
      setFilteredClockLogs(clockLogList);
      if (typeof window !== "undefined") {
        localStorage.setItem("clockLogs", JSON.stringify(clockLogList));
      }
    } catch (error) {
      console.error("Error fetching clock logs from Firestore:", error);
      setClockLogs([]);
      setFilteredClockLogs([]);
      setClockLogsError(error.message || "Failed to fetch clock logs");
    } finally {
      setClockLogsLoading(false);
    }
  };

  const fetchMessageLogs = async () => {
    setMessageLogsLoading(true);
    setMessageLogsError(null);
    try {
      const messagesQuery = query(collection(db, "messages"), orderBy("lastUpdated", "desc"));
      const snapshot = await getDocs(messagesQuery);
      if (snapshot.empty) {
        setMessageLogs([]);
        setFilteredMessageLogs([]);
        if (typeof window !== "undefined") {
          localStorage.setItem("messageLogs", JSON.stringify([]));
        }
        return;
      }
      const messageList = snapshot.docs.map((doc) => ({
        id: doc.id,
        lastUpdated: doc.data().lastUpdated || "N/A",
        messages: doc.data().messages || [],
      }));
      setMessageLogs(messageList);
      setFilteredMessageLogs(messageList);
      if (typeof window !== "undefined") {
        localStorage.setItem("messageLogs", JSON.stringify(messageList));
      }
    } catch (error) {
      console.error("Error fetching message logs:", error);
      setMessageLogs([]);
      setFilteredMessageLogs([]);
      setMessageLogsError(error.message || "Failed to fetch message logs");
    } finally {
      setMessageLogsLoading(false);
    }
  };

  const handleLogFilter = (key: string, value: string) => {
    setLogFilter((prev) => ({ ...prev, [key]: value }));
    let filtered = logs;

    if (logFilter.email || (key === "email" && value)) {
      filtered = filtered.filter((log) =>
        log.email?.toLowerCase().includes((key === "email" ? value : logFilter.email).toLowerCase())
      );
    }

    if (logFilter.startDate || (key === "startDate" && value)) {
      const selectedDateStr = key === "startDate" ? value : logFilter.startDate;
      const selectedDate = new Date(selectedDateStr);
      const startOfDay = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate(), 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate(), 23, 59, 59, 999));
      
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= startOfDay && logDate <= endOfDay;
      });
    }

    if (logFilter.role || (key === "role" && value)) {
      filtered = filtered.filter((log) =>
        log.role?.toLowerCase().includes((key === "role" ? value : logFilter.role).toLowerCase())
      );
    }

    if (logFilter.action || (key === "action" && value)) {
      filtered = filtered.filter((log) =>
        log.action?.toLowerCase().includes((key === "action" ? value : logFilter.action).toLowerCase())
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage((prev) => ({ ...prev, activity: 1 }));
  };

  const handleClockLogFilter = (key: string, value: string) => {
    setClockLogFilter((prev) => ({ ...prev, [key]: value }));
    let filtered = clockLogs;

    if (clockLogFilter.name || (key === "name" && value)) {
      filtered = filtered.filter((log) =>
        log.name?.toLowerCase().includes((key === "name" ? value : clockLogFilter.name).toLowerCase())
      );
    }

    if (clockLogFilter.startDate || (key === "startDate" && value)) {
      const selectedDateStr = key === "startDate" ? value : clockLogFilter.startDate;
      const selectedDate = new Date(selectedDateStr);
      const startOfDay = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate(), 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate(), 23, 59, 59, 999));
      
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= startOfDay && logDate <= endOfDay;
      });
    }

    setFilteredClockLogs(filtered);
    setCurrentPage((prev) => ({ ...prev, clock: 1 }));
  };

  const handleMessageLogFilter = (key: string, value: string) => {
    setMessageLogFilter((prev) => ({ ...prev, [key]: value }));
    let filtered = messageLogs.map((msg) => ({
      ...msg,
      messages: msg.messages.filter((message: any) => {
        const matchesSender = message.sender?.toLowerCase().includes(
          (key === "sender" ? value : messageLogFilter.sender).toLowerCase()
        );
        const matchesContent = message.message?.toLowerCase().includes(
          (key === "content" ? value : messageLogFilter.content).toLowerCase()
        );
        return (
          (messageLogFilter.sender || value ? matchesSender : true) &&
          (messageLogFilter.content || (key === "content" && value) ? matchesContent : true)
        );
      }),
    })).filter((msg) => msg.messages.length > 0);
    setFilteredMessageLogs(filtered);
    setCurrentPage((prev) => ({ ...prev, chat: 1 }));
  };

  const clearFilters = (type: string) => {
    if (type === "activity") {
      setLogFilter({ email: "", startDate: "", role: "", action: "" });
      setFilteredLogs(logs);
    } else if (type === "clock") {
      setClockLogFilter({ name: "", startDate: "" });
      setFilteredClockLogs(clockLogs);
    } else if (type === "chat") {
      setMessageLogFilter({ sender: "", content: "" });
      setFilteredMessageLogs(messageLogs);
    }
    setCurrentPage((prev) => ({ ...prev, [type]: 1 }));
  };

  const toggleMessageExpand = (msgId: string) => {
    setExpandedMessages((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard/admin");
  };

  useEffect(() => {
    loadCachedData();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const roleResponse = await fetch("http://127.0.0.1:8080/check-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          });
          const roleData = await roleResponse.json();
          if (roleData.role !== "admin") {
            router.push(`/dashboard/${roleData.role}`);
          } else {
            setUser({ ...user, role: roleData.role });
            fetchLogs();
            fetchClockLogs();
            fetchMessageLogs();
          }
        } catch (error) {
          console.error("Error during authentication:", error);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const paginate = (data: any[], page: number) => {
    const start = (page - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  };

  if (!user) {
    return <div className="text-foreground">Loading...</div>;
  }

  return (
    <DashboardLayout userType="admin" user={user}>
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleBackToDashboard}
          className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 group"
        >
          <ArrowLeftCircle className="h-8 w-8" />
          <span className="absolute right-20 w-40 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-200 text-sm font-medium py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Back to Dashboard
          </span>
          <div className="absolute inset-0 rounded-full bg-white dark:bg-gray-900 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-foreground">Logs Management</h1>
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="mb-6 bg-background border-b border-muted">
          <TabsTrigger 
            value="activity" 
            className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold px-4 py-2 transition-all duration-100"
          >
            Activity Logs
          </TabsTrigger>
          <TabsTrigger 
            value="chat" 
            className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold px-4 py-2 transition-all duration-100"
          >
            Chat Logs
          </TabsTrigger>
          <TabsTrigger 
            value="clock" 
            className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold px-4 py-2 transition-all duration-100"
          >
            Clock In/Out Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card className="shadow-lg bg-card text-card-foreground">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl text-foreground">Activity Logs</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {logsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : logs.length > 0 ? (
                <>
                  <div className="mb-6 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        placeholder="Filter by email..."
                        value={logFilter.email}
                        onChange={(e) => handleLogFilter("email", e.target.value)}
                        className="border-input bg-background text-foreground focus:border-primary"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        type="date"
                        placeholder="Filter by Date"
                        value={logFilter.startDate}
                        onChange={(e) => handleLogFilter("startDate", e.target.value)}
                        className="border-input bg-background text-foreground focus:border-primary"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        placeholder="Filter by role..."
                        value={logFilter.role}
                        onChange={(e) => handleLogFilter("role", e.target.value)}
                        className="border-input bg-background text-foreground focus:border-primary"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        placeholder="Filter by action..."
                        value={logFilter.action}
                        onChange={(e) => handleLogFilter("action", e.target.value)}
                        className="border-input bg-background text-foreground focus:border-primary"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => clearFilters("activity")}
                      disabled={
                        !logFilter.email &&
                        !logFilter.startDate &&
                        !logFilter.role &&
                        !logFilter.action
                      }
                      className="border-input text-foreground hover:bg-muted"
                    >
                      Clear Filters
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-foreground">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-4">Date/Time</th>
                          <th className="text-left p-4">Email</th>
                          <th className="text-left p-4">UserID</th>
                          <th className="text-left p-4">Role</th>
                          <th className="text-left p-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginate(filteredLogs, currentPage.activity).map((log) => (
                          <tr key={log.id} className="border-t border-muted hover:bg-muted/50 transition-colors">
                            <td className="p-4">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                            </td>
                            <td className="p-4">{log.email || "N/A"}</td>
                            <td className="p-4">{log.user_id || "N/A"}</td>
                            <td className="p-4">{log.role || "N/A"}</td>
                            <td className="p-4">{log.action || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => ({ ...prev, activity: prev.activity - 1 }))}
                        disabled={currentPage.activity === 1}
                        className="border-input text-foreground hover:bg-muted"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => ({ ...prev, activity: prev.activity + 1 }))}
                        disabled={currentPage.activity * itemsPerPage >= filteredLogs.length}
                        className="border-input text-foreground hover:bg-muted"
                      >
                        Next
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => exportToCSV(filteredLogs, "activity_logs.csv")}
                      className="flex items-center gap-2 border-input text-foreground hover:bg-muted"
                    >
                      <Download className="h-4 w-4" /> Export to CSV
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchLogs}
                    className="mt-4 border-primary text-primary hover:bg-primary/10"
                  >
                    Refresh Activity Logs
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">No activity logs available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card className="shadow-lg bg-card text-card-foreground">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl text-foreground">Chat Logs</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {messageLogsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : messageLogsError ? (
                <p className="text-destructive">Error: {messageLogsError}</p>
              ) : messageLogs.length > 0 ? (
                <>
                  <div className="mb-6 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        placeholder="Filter by Sender ID..."
                        value={messageLogFilter.sender}
                        onChange={(e) => handleMessageLogFilter("sender", e.target.value)}
                        className="border-input bg-background text-foreground focus:border-primary"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        placeholder="Filter by Message Content..."
                        value={messageLogFilter.content}
                        onChange={(e) => handleMessageLogFilter("content", e.target.value)}
                        className="border-input bg-background text-foreground focus:border-primary"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => clearFilters("chat")}
                      disabled={!messageLogFilter.sender && !messageLogFilter.content}
                      className="border-input text-foreground hover:bg-muted"
                    >
                      Clear Filters
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {paginate(filteredMessageLogs, currentPage.chat).map((msg) => (
                      <div key={msg.id} className="border border-muted rounded-lg p-4 bg-muted/20">
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => toggleMessageExpand(msg.id)}
                        >
                          <p className="text-foreground font-medium">Last Updated: {msg.lastUpdated}</p>
                          {expandedMessages.includes(msg.id) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        {expandedMessages.includes(msg.id) && (
                          <div className="mt-4 space-y-3">
                            {msg.messages.map((message: any) => (
                              <div key={message.messageId} className="p-3 bg-background rounded-lg shadow-sm">
                                <p>
                                  <strong>Message:</strong> {message.message}
                                </p>
                                <p>
                                  <strong>Edited:</strong> {message.edited ? "Yes" : "No"}
                                </p>
                                <p>
                                  <strong>Message ID:</strong> {message.messageId}
                                </p>
                                <p>
                                  <strong>Sender:</strong> {message.sender}
                                </p>
                                <p>
                                  <strong>Timestamp:</strong> {message.timestamp}
                                </p>
                                <p>
                                  <strong>Reactions:</strong>
                                </p>
                                <div className="flex gap-2">
                                  {Object.entries(message.reactions || {}).map(([userId, emoji]) => (
                                    <span key={userId} className="text-lg">
                                      {emoji || "❓"}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => ({ ...prev, chat: prev.chat - 1 }))}
                        disabled={currentPage.chat === 1}
                        className="border-input text-foreground hover:bg-muted"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => ({ ...prev, chat: prev.chat + 1 }))}
                        disabled={currentPage.chat * itemsPerPage >= filteredMessageLogs.length}
                        className="border-input text-foreground hover:bg-muted"
                      >
                        Next
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        exportToCSV(
                          filteredMessageLogs.flatMap((msg) =>
                            msg.messages.map((m: any) => ({
                              lastUpdated: msg.lastUpdated,
                              message: m.message,
                              edited: m.edited ? "Yes" : "No",
                              messageId: m.messageId,
                              sender: m.sender,
                              timestamp: m.timestamp,
                              reactions: Object.entries(m.reactions || {})
                                .map(([_, emoji]) => emoji)
                                .join(", "),
                            }))
                          ),
                          "chat_logs.csv"
                        )
                      }
                      className="flex items-center gap-2 border-input text-foreground hover:bg-muted"
                    >
                      <Download className="h-4 w-4" /> Export to CSV
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchMessageLogs}
                    className="mt-4 border-primary text-primary hover:bg-primary/10"
                  >
                    Refresh Chat Logs
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">No chat logs available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clock">
          <Card className="shadow-lg bg-card text-card-foreground">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl text-foreground">Clock In/Out Logs</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {clockLogsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : clockLogsError ? (
                <p className="text-destructive">Error: {clockLogsError}</p>
              ) : clockLogs.length > 0 ? (
                <>
                  <div className="mb-6 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        placeholder="Filter by Name..."
                        value={clockLogFilter.name}
                        onChange={(e) => handleClockLogFilter("name", e.target.value)}
                        className="border-input bg-background text-foreground focus:border-primary"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        type="date"
                        placeholder="Filter by Date"
                        value={clockLogFilter.startDate}
                        onChange={(e) => handleClockLogFilter("startDate", e.target.value)}
                        className="border-input bg-background text-foreground focus:border-primary"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => clearFilters("clock")}
                      disabled={!clockLogFilter.name && !clockLogFilter.startDate}
                      className="border-input text-foreground hover:bg-muted"
                    >
                      Clear Filters
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-foreground">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-4">Date/Time</th>
                          <th className="text-left p-4">Name</th>
                          <th className="text-left p-4">UserID</th>
                          <th className="text-left p-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginate(filteredClockLogs, currentPage.clock).map((log) => (
                          <tr key={log.id} className="border-t border-muted hover:bg-muted/50 transition-colors">
                            <td className="p-4">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                            </td>
                            <td className="p-4">{log.name || "N/A"}</td>
                            <td className="p-4">{log.user_id || "N/A"}</td>
                            <td className="p-4">{log.action || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => ({ ...prev, clock: prev.clock - 1 }))}
                        disabled={currentPage.clock === 1}
                        className="border-input text-foreground hover:bg-muted"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => ({ ...prev, clock: prev.clock + 1 }))}
                        disabled={currentPage.clock * itemsPerPage >= filteredClockLogs.length}
                        className="border-input text-foreground hover:bg-muted"
                      >
                        Next
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => exportToCSV(filteredClockLogs, "clock_logs.csv")}
                      className="flex items-center gap-2 border-input text-foreground hover:bg-muted"
                    >
                      <Download className="h-4 w-4" /> Export to CSV
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchClockLogs}
                    className="mt-4 border-primary text-primary hover:bg-primary/10"
                  >
                    Refresh Clock Logs
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">No clock logs available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}