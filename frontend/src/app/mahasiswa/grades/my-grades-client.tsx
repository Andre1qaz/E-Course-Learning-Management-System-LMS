'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, BookOpen, CheckCircle, XCircle, Award } from 'lucide-react';
import { toast } from 'sonner';

// Heuristic #1: Visibility of System Status — clear grade display
// Heuristic #6: Recognition Rather Than Recall — organized by course
// Heuristic #21: Motivation — progress visualization

interface MyGradesClientProps {
  token: string;
}

interface CourseGrade {
  course: {
    id: string;
    name: string;
    code: string;
    settings: {
      passingGrade: number;
      assignmentWeight: number;
      quizWeight: number;
      utsWeight: number;
      uasWeight: number;
      otherWeight: number;
    };
  };
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

interface Assignment {
  id: string;
  title: string;
  maxScore: number;
  submissions: Array<{
    score: number | null;
    feedback: string | null;
    status: string;
  }>;
}

interface Exam {
  id: string;
  title: string;
  category: string;
  maxScore: number;
  attempts: Array<{
    totalScore: number | null;
    status: string;
  }>;
}

export function MyGradesClient({ token }: MyGradesClientProps) {
  const [allGrades, setAllGrades] = useState<CourseGrade[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courseDetail, setCourseDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllGrades();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseDetail();
    }
  }, [selectedCourse]);

  const fetchAllGrades = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/gradebook/my-grades', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAllGrades(data.data.enrollments);
        if (data.data.enrollments.length > 0) {
          setSelectedCourse(data.data.enrollments[0].course.id);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetail = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/gradebook/my-grades/${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCourseDetail(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  };

  const selectedCourseData = allGrades.find((g) => g.course.id === selectedCourse);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nilai Saya</h1>
        <p className="text-gray-600 mt-1">Pantau perkembangan akademik Anda</p>
      </div>

      {/* Course Selector */}
      <div className="flex gap-4 items-center">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[400px]">
            <SelectValue placeholder="Pilih Course" />
          </SelectTrigger>
          <SelectContent>
            {allGrades.map((item) => (
              <SelectItem key={item.course.id} value={item.course.id}>
                {item.course.code} - {item.course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allGrades.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allGrades.filter((g) => g.grade?.passed).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allGrades.length > 0
                ? (allGrades.reduce((sum, g) => sum + (g.grade?.finalScore || 0), 0) / allGrades.length).toFixed(1)
                : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Award className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allGrades.length > 0
                ? (allGrades.reduce((sum, g) => sum + (g.grade?.completionPercentage || 0), 0) / allGrades.length).toFixed(0)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Detail */}
      {selectedCourseData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{selectedCourseData.course.code} - {selectedCourseData.course.name}</CardTitle>
                <CardDescription>Ringkasan nilai Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedCourseData.grade ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Assignment Score</span>
                            <span className="text-sm font-bold">{selectedCourseData.grade.assignmentScore.toFixed(1)}</span>
                          </div>
                          <Progress value={selectedCourseData.grade.assignmentScore} className="h-2" />
                          <p className="text-xs text-gray-600 mt-1">Weight: {(selectedCourseData.course.settings.assignmentWeight * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Quiz Score</span>
                            <span className="text-sm font-bold">{selectedCourseData.grade.quizScore.toFixed(1)}</span>
                          </div>
                          <Progress value={selectedCourseData.grade.quizScore} className="h-2" />
                          <p className="text-xs text-gray-600 mt-1">Weight: {(selectedCourseData.course.settings.quizWeight * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">UTS Score</span>
                            <span className="text-sm font-bold">{selectedCourseData.grade.utsScore.toFixed(1)}</span>
                          </div>
                          <Progress value={selectedCourseData.grade.utsScore} className="h-2" />
                          <p className="text-xs text-gray-600 mt-1">Weight: {(selectedCourseData.course.settings.utsWeight * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">UAS Score</span>
                            <span className="text-sm font-bold">{selectedCourseData.grade.uasScore.toFixed(1)}</span>
                          </div>
                          <Progress value={selectedCourseData.grade.uasScore} className="h-2" />
                          <p className="text-xs text-gray-600 mt-1">Weight: {(selectedCourseData.course.settings.uasWeight * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Other Score</span>
                            <span className="text-sm font-bold">{selectedCourseData.grade.otherScore.toFixed(1)}</span>
                          </div>
                          <Progress value={selectedCourseData.grade.otherScore} className="h-2" />
                          <p className="text-xs text-gray-600 mt-1">Weight: {(selectedCourseData.course.settings.otherWeight * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Completion</span>
                            <span className="text-sm font-bold">{selectedCourseData.grade.completionPercentage.toFixed(0)}%</span>
                          </div>
                          <Progress value={selectedCourseData.grade.completionPercentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Final Score</p>
                          <p className="text-3xl font-bold">{selectedCourseData.grade.finalScore.toFixed(1)}</p>
                        </div>
                        <div className="text-right">
                          {selectedCourseData.grade.passed ? (
                            <Badge className="bg-green-600 text-white px-4 py-2 text-sm">PASSED</Badge>
                          ) : (
                            <Badge className="bg-red-600 text-white px-4 py-2 text-sm">FAILED</Badge>
                          )}
                          <p className="text-xs text-gray-600 mt-1">Passing Grade: {selectedCourseData.course.settings.passingGrade}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    No grades available yet. Complete activities to see your progress.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            {courseDetail?.assignments && courseDetail.assignments.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Grades</CardTitle>
                  <CardDescription>Nilai tugas Anda</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseDetail.assignments.map((assignment: Assignment) => {
                      const submission = assignment.submissions[0];
                      return (
                        <div key={assignment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{assignment.title}</h4>
                              <p className="text-sm text-gray-600">Max Score: {assignment.maxScore}</p>
                            </div>
                            {submission ? (
                              <div className="text-right">
                                <Badge variant={submission.score !== null ? 'default' : 'secondary'}>
                                  {submission.status}
                                </Badge>
                                {submission.score !== null && (
                                  <p className="text-lg font-bold mt-1">{submission.score.toFixed(1)}</p>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary">Not Submitted</Badge>
                            )}
                          </div>
                          {submission?.feedback && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                              <p className="font-medium">Feedback:</p>
                              <p className="text-gray-600">{submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-gray-600">
                  No assignments available
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="exams" className="space-y-4">
            {courseDetail?.exams && courseDetail.exams.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Exam Grades</CardTitle>
                  <CardDescription>Nilai ujian Anda</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseDetail.exams.map((exam: Exam) => {
                      const attempt = exam.attempts[0];
                      return (
                        <div key={exam.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{exam.title}</h4>
                              <p className="text-sm text-gray-600">
                                {exam.category} • Max Score: {exam.maxScore}
                              </p>
                            </div>
                            {attempt ? (
                              <div className="text-right">
                                <Badge variant={attempt.totalScore !== null ? 'default' : 'secondary'}>
                                  {attempt.status}
                                </Badge>
                                {attempt.totalScore !== null && (
                                  <p className="text-lg font-bold mt-1">{attempt.totalScore.toFixed(1)}</p>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary">Not Attempted</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-gray-600">
                  No exams available
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
