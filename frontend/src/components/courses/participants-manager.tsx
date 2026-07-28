"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Search, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getCourseParticipants, removeCourseParticipant, directEnrollCourse, getUsers, Participant, User } from "@/lib/api";

interface ParticipantsManagerProps {
  token: string;
  courseId: string;
  courseName: string;
}

// Heuristic #6: Recognition Rather Than Recall — clear participant information display
// Heuristic #1: Visibility of System Status — show participant count and status
export function ParticipantsManager({ token, courseId, courseName }: ParticipantsManagerProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "ASSISTANT">("STUDENT");
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    loadParticipants();
  }, [courseId, token]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await getCourseParticipants(token, courseId);
      setParticipants(response.data.participants);
      setTotalParticipants(response.data.totalParticipants);
    } catch (error) {
      toast.error("Gagal memuat daftar peserta");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await getUsers(token);
      // Filter out users who are already enrolled and are students
      const enrolledUserIds = participants.map((p) => p.userId);
      const available = response.data.filter(
        (user) => user.role === "MAHASISWA" && !enrolledUserIds.includes(user.id)
      );
      setAvailableUsers(available);
    } catch (error) {
      toast.error("Gagal memuat daftar mahasiswa");
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedUserId) {
      toast.error("Pilih mahasiswa terlebih dahulu");
      return;
    }

    setAddingUser(true);
    try {
      await directEnrollCourse(token, courseId, selectedUserId, selectedRole);
      toast.success("Mahasiswa berhasil didaftarkan");
      setShowAddDialog(false);
      setSelectedUserId("");
      setSelectedRole("STUDENT");
      loadParticipants();
    } catch (error: any) {
      toast.error(error.message || "Gagal mendaftarkan mahasiswa");
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${userName} dari course ini?`)) {
      return;
    }

    try {
      await removeCourseParticipant(token, courseId, participantId);
      toast.success("Peserta berhasil dihapus");
      loadParticipants();
    } catch (error) {
      toast.error("Gagal menghapus peserta");
    }
  };

  const handleOpenAddDialog = async () => {
    setShowAddDialog(true);
    await loadAvailableUsers();
  };

  const filteredParticipants = participants.filter((participant) =>
    participant.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Peserta Course
            </CardTitle>
            <CardDescription>
              {courseName} • {totalParticipants} peserta terdaftar
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAddDialog}>
                <UserPlus className="mr-2 h-4 w-4" />
                Tambah Peserta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Peserta Langsung</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Mahasiswa</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="user">
                      <SelectValue placeholder="Pilih mahasiswa" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Mahasiswa</SelectItem>
                      <SelectItem value="ASSISTANT">Asisten</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddParticipant}
                  disabled={addingUser || !selectedUserId}
                >
                  {addingUser ? "Memproses..." : "Tambah Peserta"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari peserta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat daftar peserta...
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "Tidak ada peserta yang cocok" : "Belum ada peserta terdaftar"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{participant.userName}</p>
                      <p className="text-sm text-muted-foreground">{participant.userEmail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={participant.role === "ASSISTANT" ? "default" : "secondary"}>
                          {participant.role === "ASSISTANT" ? "Asisten" : "Mahasiswa"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Bergabung {formatDate(participant.joinedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveParticipant(participant.id, participant.userName)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
