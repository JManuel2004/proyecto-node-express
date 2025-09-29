import {Schema , Document , model} from "mongoose";
import { IProject , IUser } from "../types";
import { ITask } from "../types";

export interface TaskDocument extends Omit<ITask, "_id">, Document {}

const taskSchema = new Schema<TaskDocument>({
  title: {
    type: String,
    required: [true, 'El título de la tarea es obligatorio'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  deadline: {
    type: Date,
    required: [true, 'La fecha límite es obligatoria']
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',   
    required: [true, 'La tarea debe estar asociada a un proyecto']
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Índices recomendados
taskSchema.index({ project: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ deadline: 1 });

export const TaskModel = model<TaskDocument>('Task', taskSchema);