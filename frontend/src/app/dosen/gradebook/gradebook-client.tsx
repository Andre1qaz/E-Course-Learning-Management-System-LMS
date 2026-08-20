'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, RefreshCw, Settings, History, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

// Heuristic #1: Visibility of System Status — loading states and clear feedback
// Heuristic #6: Recognition Rather Than Recall — clear labels and organization
// Heuristic #16: Instructional Assessment — detailed grade display

interface GradebookClientProps {
  token: string;
  isAdmin?: boolean;
}

interface StudentGrade {
  id: string;
  name: string;
  email: string;
  grade: {
    id: string;
    assignmentScore: number;
    quizScore: number;
    utsScore: number;
    uasScore: number;
    otherScore: number;
    finalScore: number;
    passed: boolean;
    completionPercentage: number;
  } | null;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface GradebookData {
  course: Course & {
    settings: {
      passingGrade: number;
      assignmentWeight: number;
      quizWeight: number;
      utsWeight: number;
      uasWeight: number;
      otherWeight: number;
    };
  };
  students: StudentGrade[];
}

export function GradebookClient({ token, isAdmin = false }: GradebookClientProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [gradebookData, setGradebookData] = useState<GradebookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentGrade | null>(null);
  const [gradeHistory, setGradeHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    passingGrade: 60,
    assignmentWeight: 0.3,
    quizWeight: 0.2,
    utsWeight: 0.2,
    uasWeight: 0.3,
    otherWeight: 0,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchGradebook();
      fetchStatistics();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
        if (data.data.length > 0) {
          setSelectedCourse(data.data[0].id);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch courses');
    }
  };

  const fetchGradebook = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/gradebook/course/${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setGradebookData(data.data);
        if (data.data.course.settings) {
          setSettings(data.data.course.settings);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch gradebook');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!selectedCourse) return;
    try {
      const response = await fetch(`http://localhost:3001/api/gradebook/course/${selectedCourse}/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat statistik');
    }
  };

  const recalculateGrades = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/gradebook/course/${selectedCourse}/recalculate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Grades recalculated successfully');
        fetchGradebook();
        fetchStatistics();
      }
    } catch (error) {
      toast.error('Failed to recalculate grades');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    if (!selectedCourse) return;
    try {
      const response = await fetch(`http://localhost:3001/api/gradebook/course/${selectedCourse}/settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Settings updated successfully');
        setSettingsOpen(false);
        fetchGradebook();
        fetchStatistics();
      }
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const exportGradebook = async (format: string = 'excel') => {
    if (!selectedCourse) return;
    try {
      const response = await fetch(`http://localhost:3001/api/gradebook/course/${selectedCourse}/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const buffer = Buffer.from(data.data.buffer, 'base64');
        const blob = new Blob([buffer], { type: data.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Gradebook exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      toast.error('Failed to export gradebook');
    }
  };

  const fetchGradeHistory = async (studentId: string) => {
    if (!selectedCourse) return;
    try {
      const response = await fetch(`http://localhost:3001/api/gradebook/course/${selectedCourse}/history/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setGradeHistory(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch grade history');
    }
  };

  const handleStudentClick = (student: StudentGrade) => {
    setSelectedStudent(student);
    fetchGradeHistory(student.id);
    setHistoryOpen(true);
  };

  const updateStudentGrade = async (studentId: string, field: string, value: number) => {
    if (!selectedCourse) return;
    try {
      const response = await fetch(`http://localhost:3001/api/gradebook/course/${selectedCourse}/student/${studentId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Grade updated successfully');
        fetchGradebook();
        fetchStatistics();
      }
    } catch (error) {
      toast.error('Failed to update grade');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gradebook</h1>
          <p className="text-gray-600 mt-1">Kelola nilai mahasiswa untuk setiap course</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Pilih Course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={recalculateGrades} variant="outline" disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalculate
          </Button>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Course Grading Settings</DialogTitle>
                <DialogDescription>Atur bobot penilaian dan passing grade</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Passing Grade</Label>
                  <Input
                    type="number"
                    value={settings.passingGrade}
                    onChange={(e) => setSettings({ ...settings, passingGrade: parseFloat(e.target.value) })}
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <Label>Assignment Weight ({(settings.assignmentWeight * 100).toFixed(0)}%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.assignmentWeight}
                    onChange={(e) => setSettings({ ...settings, assignmentWeight: parseFloat(e.target.value) })}
                    min={0}
                    max={1}
                  />
                </div>
                <div>
                  <Label>Quiz Weight ({(settings.quizWeight * 100).toFixed(0)}%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.quizWeight}
                    onChange={(e) => setSettings({ ...settings, quizWeight: parseFloat(e.target.value) })}
                    min={0}
                    max={1}
                  />
                </div>
                <div>
                  <Label>UTS Weight ({(settings.utsWeight * 100).toFixed(0)}%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.utsWeight}
                    onChange={(e) => setSettings({ ...settings, utsWeight: parseFloat(e.target.value) })}
                    min={0}
                    max={1}
                  />
                </div>
                <div>
                  <Label>UAS Weight ({(settings.uasWeight * 100).toFixed(0)}%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.uasWeight}
                    onChange={(e) => setSettings({ ...settings, uasWeight: parseFloat(e.target.value) })}
                    min={0}
                    max={1}
                  />
                </div>
                <div>
                  <Label>Other Weight ({(settings.otherWeight * 100).toFixed(0)}%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.otherWeight}
                    onChange={(e) => setSettings({ ...settings, otherWeight: parseFloat(e.target.value) })}
                    min={0}
                    max={1}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={updateSettings}>Save Settings</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => exportGradebook('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={() => exportGradebook('csv')} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.passedStudents}</div>
              <p className="text-xs text-gray-600">{statistics.passRate.toFixed(1)}% pass rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.failedStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Final Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.averageScores.final.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gradebook Table */}
      {gradebookData && (
        <Card>
          <CardHeader>
            <CardTitle>{gradebookData.course.code} - {gradebookData.course.name}</CardTitle>
            <CardDescription>Nilai mahasiswa terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-right">Assignment</TableHead>
                      <TableHead className="text-right">Quiz</TableHead>
                      <TableHead className="text-right">UTS</TableHead>
                      <TableHead className="text-right">UAS</TableHead>
                      <TableHead className="text-right">Other</TableHead>
                      <TableHead className="text-right">Final</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Completion</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradebookData.students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-600">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={student.grade?.assignmentScore || 0}
                            onChange={(e) => updateStudentGrade(student.id, 'assignmentScore', parseFloat(e.target.value))}
                            className="w-20 text-right"
                            min={0}
                            max={100}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={student.grade?.quizScore || 0}
                            onChange={(e) => updateStudentGrade(student.id, 'quizScore', parseFloat(e.target.value))}
                            className="w-20 text-right"
                            min={0}
                            max={100}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={student.grade?.utsScore || 0}
                            onChange={(e) => updateStudentGrade(student.id, 'utsScore', parseFloat(e.target.value))}
                            className="w-20 text-right"
                            min={0}
                            max={100}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={student.grade?.uasScore || 0}
                            onChange={(e) => updateStudentGrade(student.id, 'uasScore', parseFloat(e.target.value))}
                            className="w-20 text-right"
                            min={0}
                            max={100}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={student.grade?.otherScore || 0}
                            onChange={(e) => updateStudentGrade(student.id, 'otherScore', parseFloat(e.target.value))}
                            className="w-20 text-right"
                            min={0}
                            max={100}
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {student.grade?.finalScore?.toFixed(1) || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {student.grade?.passed ? (
                            <Badge className="bg-green-600">Passed</Badge>
                          ) : (
                            <Badge className="bg-red-600">Failed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={student.grade?.completionPercentage || 0} className="w-16" />
                            <span className="text-sm">{student.grade?.completionPercentage?.toFixed(0) || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStudentClick(student)}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grade History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grade History - {selectedStudent?.name}</DialogTitle>
            <DialogDescription>Riwayat perubahan nilai</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {gradeHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No grade history available</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Old Value</TableHead>
                    <TableHead>New Value</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradeHistory.map((history) => (
                    <TableRow key={history.id}>
                      <TableCell>{history.fieldName}</TableCell>
                      <TableCell>{history.oldValue?.toFixed(1) || '-'}</TableCell>
                      <TableCell>{history.newValue?.toFixed(1) || '-'}</TableCell>
                      <TableCell>{history.changer.name}</TableCell>
                      <TableCell>{new Date(history.changedAt).toLocaleString()}</TableCell>
                      <TableCell>{history.changeReason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
