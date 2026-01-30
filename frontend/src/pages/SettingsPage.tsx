import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchClassWeights, updateClassWeights, type WeightValues } from '../api/grades';
import { updateClass } from '../api/classes';
import { useClassStore } from '../store/classStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

export function SettingsPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { fetchClasses } = useClassStore();

  // Class info state
  const [className, setClassName] = useState('');
  const [section, setSection] = useState<string>('');
  const [originalClassName, setOriginalClassName] = useState('');
  const [originalSection, setOriginalSection] = useState<string>('');
  const [isSavingClassInfo, setIsSavingClassInfo] = useState(false);
  const [classInfoSuccess, setClassInfoSuccess] = useState<string | null>(null);
  const [classInfoError, setClassInfoError] = useState<string | null>(null);

  // Grade weights state
  const [weights, setWeights] = useState<WeightValues>({
    attendanceWeight: 10,
    quizWeight: 30,
    examWeight: 40,
    activityWeight: 20,
  });
  const [originalWeights, setOriginalWeights] = useState<WeightValues>({
    attendanceWeight: 10,
    quizWeight: 30,
    examWeight: 40,
    activityWeight: 20,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      loadWeights();
    }
  }, [classId]);

  const loadWeights = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchClassWeights(parseInt(classId!));
      setClassName(data.className);
      setSection(data.section || '');
      setOriginalClassName(data.className);
      setOriginalSection(data.section || '');
      setWeights(data.weights);
      setOriginalWeights(data.weights);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (field: keyof WeightValues, value: string) => {
    const numValue = parseFloat(value) || 0;
    setWeights((prev) => ({ ...prev, [field]: numValue }));
    setSuccess(null);
  };

  const getTotal = () => {
    return weights.attendanceWeight + weights.quizWeight + weights.examWeight + weights.activityWeight;
  };

  const isValid = () => {
    const total = getTotal();
    return Math.abs(total - 100) < 0.01;
  };

  const hasChanges = () => {
    return (
      weights.attendanceWeight !== originalWeights.attendanceWeight ||
      weights.quizWeight !== originalWeights.quizWeight ||
      weights.examWeight !== originalWeights.examWeight ||
      weights.activityWeight !== originalWeights.activityWeight
    );
  };

  const handleReset = () => {
    setWeights(originalWeights);
    setSuccess(null);
    setError(null);
  };

  const hasClassInfoChanges = () => {
    return className !== originalClassName || section !== originalSection;
  };

  const handleResetClassInfo = () => {
    setClassName(originalClassName);
    setSection(originalSection);
    setClassInfoSuccess(null);
    setClassInfoError(null);
  };

  const handleSaveClassInfo = async () => {
    if (!className.trim()) {
      setClassInfoError('Class name is required');
      return;
    }

    try {
      setIsSavingClassInfo(true);
      setClassInfoError(null);
      setClassInfoSuccess(null);
      await updateClass(parseInt(classId!), {
        name: className.trim(),
        section: section.trim() || undefined,
      });
      setOriginalClassName(className.trim());
      setOriginalSection(section.trim());
      setClassInfoSuccess('Class information updated successfully');
      fetchClasses(); // Refresh the sidebar class list
    } catch (err) {
      setClassInfoError((err as Error).message);
    } finally {
      setIsSavingClassInfo(false);
    }
  };

  const handleSave = async () => {
    if (!isValid()) {
      setError('Weights must sum to 100%');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      await updateClassWeights(parseInt(classId!), weights);
      setOriginalWeights(weights);
      setSuccess('Grade weights updated successfully');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/classes/${classId}/grades`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Settings: {originalClassName}
            {originalSection && <span className="text-muted-foreground"> - {originalSection}</span>}
          </h1>
          <p className="text-muted-foreground">Configure class information and grade settings</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>
            Edit the class name and section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {classInfoError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{classInfoError}</AlertDescription>
            </Alert>
          )}

          {classInfoSuccess && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{classInfoSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="className">Class Name</Label>
              <Input
                id="className"
                value={className}
                onChange={(e) => {
                  setClassName(e.target.value);
                  setClassInfoSuccess(null);
                }}
                placeholder="e.g., Mathematics 101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section (Optional)</Label>
              <Input
                id="section"
                value={section}
                onChange={(e) => {
                  setSection(e.target.value);
                  setClassInfoSuccess(null);
                }}
                placeholder="e.g., Section A"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleResetClassInfo}
              disabled={!hasClassInfoChanges() || isSavingClassInfo}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSaveClassInfo}
              disabled={!hasClassInfoChanges() || !className.trim() || isSavingClassInfo}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSavingClassInfo ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grade Weights</CardTitle>
          <CardDescription>
            Set the percentage weight for each component of the final grade.
            Weights must total exactly 100%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="attendance">Attendance Weight (%)</Label>
              <Input
                id="attendance"
                type="number"
                min="0"
                max="100"
                step="1"
                value={weights.attendanceWeight}
                onChange={(e) => handleWeightChange('attendanceWeight', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Based on present/late/absent records
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz">Quiz Weight (%)</Label>
              <Input
                id="quiz"
                type="number"
                min="0"
                max="100"
                step="1"
                value={weights.quizWeight}
                onChange={(e) => handleWeightChange('quizWeight', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Average of all quiz scores
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam">Exam Weight (%)</Label>
              <Input
                id="exam"
                type="number"
                min="0"
                max="100"
                step="1"
                value={weights.examWeight}
                onChange={(e) => handleWeightChange('examWeight', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Average of all exam scores
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">Activity Weight (%)</Label>
              <Input
                id="activity"
                type="number"
                min="0"
                max="100"
                step="1"
                value={weights.activityWeight}
                onChange={(e) => handleWeightChange('activityWeight', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Average of all activity scores
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total:</span>
              <span
                className={`text-lg font-bold ${
                  isValid() ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {getTotal().toFixed(0)}%
              </span>
              {!isValid() && (
                <span className="text-sm text-red-600">
                  (must equal 100%)
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges() || isSaving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isValid() || !hasChanges() || isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grade Calculation Formula</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm">
            <p className="text-slate-600">Final Grade =</p>
            <p className="ml-4">
              (Attendance Grade × <span className="text-blue-600">{weights.attendanceWeight}%</span>) +
            </p>
            <p className="ml-4">
              (Quiz Average × <span className="text-blue-600">{weights.quizWeight}%</span>) +
            </p>
            <p className="ml-4">
              (Exam Average × <span className="text-blue-600">{weights.examWeight}%</span>) +
            </p>
            <p className="ml-4">
              (Activity Average × <span className="text-blue-600">{weights.activityWeight}%</span>)
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Note: Changes will affect grade calculations for all students in this class.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
