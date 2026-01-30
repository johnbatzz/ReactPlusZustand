import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClassStore } from '../store/classStore';
import * as api from '../api/activities';
import type { Activity, ActivityWithStudents } from '../api/activities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, ClipboardList, Save, X } from 'lucide-react';

export function ActivitiesPage() {
  const { classId } = useParams<{ classId: string }>();
  const { currentClass, fetchClass } = useClassStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showScoresDialog, setShowScoresDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activityWithScores, setActivityWithScores] = useState<ActivityWithStudents | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formMaxScore, setFormMaxScore] = useState('100');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scores state
  const [scores, setScores] = useState<Record<number, string>>({});
  const [isSavingScores, setIsSavingScores] = useState(false);

  useEffect(() => {
    if (classId) {
      fetchClass(parseInt(classId));
      loadActivities();
    }
  }, [classId, fetchClass]);

  const loadActivities = async () => {
    if (!classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.fetchActivities(parseInt(classId));
      setActivities(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormMaxScore('100');
    setFormDate(new Date().toISOString().split('T')[0]);
    setError(null);
  };

  const handleCreate = async () => {
    if (!formName || !formMaxScore || !classId) {
      setError('Name and max score are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createActivity({
        classId: parseInt(classId),
        name: formName,
        maxScore: parseFloat(formMaxScore),
        date: formDate,
      });
      setShowCreateDialog(false);
      resetForm();
      loadActivities();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedActivity || !formName || !formMaxScore) {
      setError('Name and max score are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateActivity(selectedActivity.id, {
        name: formName,
        maxScore: parseFloat(formMaxScore),
        date: formDate,
      });
      setShowEditDialog(false);
      setSelectedActivity(null);
      resetForm();
      loadActivities();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedActivity) return;

    setIsSubmitting(true);
    try {
      await api.deleteActivity(selectedActivity.id);
      setShowDeleteDialog(false);
      setSelectedActivity(null);
      loadActivities();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (activity: Activity) => {
    setSelectedActivity(activity);
    setFormName(activity.name);
    setFormMaxScore(activity.maxScore.toString());
    setFormDate(new Date(activity.date).toISOString().split('T')[0]);
    setError(null);
    setShowEditDialog(true);
  };

  const openScoresDialog = async (activity: Activity) => {
    setSelectedActivity(activity);
    setError(null);
    try {
      const data = await api.fetchActivity(activity.id);
      setActivityWithScores(data);
      const initialScores: Record<number, string> = {};
      data.students.forEach((s) => {
        initialScores[s.id] = s.score !== null ? s.score.toString() : '';
      });
      setScores(initialScores);
      setShowScoresDialog(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSaveScores = async () => {
    if (!selectedActivity) return;

    setIsSavingScores(true);
    try {
      const scoresList = Object.entries(scores).map(([studentId, score]) => ({
        studentId: parseInt(studentId),
        score: score === '' ? null : parseFloat(score),
      }));
      await api.saveActivityScores(selectedActivity.id, scoresList);
      setShowScoresDialog(false);
      setActivityWithScores(null);
      setScores({});
      loadActivities();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSavingScores(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Activities</h1>
          {currentClass && (
            <p className="text-slate-500 mt-1">
              {currentClass.name} {currentClass.section && `- ${currentClass.section}`}
            </p>
          )}
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No activities yet</p>
            <p className="text-sm text-muted-foreground">Create your first activity to start recording scores.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Max Score</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Scores Recorded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell>{activity.maxScore}</TableCell>
                  <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                  <TableCell>{activity._count?.scores || 0} students</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openScoresDialog(activity)}
                      >
                        <ClipboardList className="h-4 w-4 mr-1" />
                        Scores
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(activity)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Activity</DialogTitle>
            <DialogDescription>
              Create a new activity to record student scores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Activity Name</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Class Participation, Homework 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxScore">Max Score</Label>
              <Input
                id="maxScore"
                type="number"
                value={formMaxScore}
                onChange={(e) => setFormMaxScore(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Activity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Activity Name</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-maxScore">Max Score</Label>
              <Input
                id="edit-maxScore"
                type="number"
                value={formMaxScore}
                onChange={(e) => setFormMaxScore(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedActivity?.name}"? This will also delete all recorded scores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scores Dialog */}
      <Dialog open={showScoresDialog} onOpenChange={setShowScoresDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Record Scores: {activityWithScores?.name}
            </DialogTitle>
            <DialogDescription>
              Max Score: {activityWithScores?.maxScore}
            </DialogDescription>
          </DialogHeader>
          {activityWithScores && (
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityWithScores.students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono">{student.studentId}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={activityWithScores.maxScore}
                          step="0.5"
                          value={scores[student.id] || ''}
                          onChange={(e) =>
                            setScores((prev) => ({ ...prev, [student.id]: e.target.value }))
                          }
                          placeholder="-"
                          className="w-24"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScoresDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveScores} disabled={isSavingScores}>
              <Save className="h-4 w-4 mr-2" />
              {isSavingScores ? 'Saving...' : 'Save Scores'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
