import { Task, Project, User } from '../models';
import { ProjectService } from './project.services';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../middleware/error';
import { CreateTaskRequest, UpdateTaskRequest, ITask } from '../types';

export class TaskService {
  static async createTask(taskData: CreateTaskRequest & { createdBy: string }): Promise<ITask> {
    const { title, description, priority, deadline, project: projectId, assignedTo } = taskData;

    await ProjectService.checkProjectPermission(projectId, taskData.createdBy, 'usuario');

    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        throw new NotFoundError('Usuario asignado no encontrado');
      }
    }

    try {
      const task = new Task({
        title,
        description,
        priority,
        deadline: new Date(deadline),
        project: projectId,
        assignedTo,
        status: 'todo'
      });

  await task.save();
  await task.populate('project', 'name description');
  await task.populate('assignedTo', 'firstName lastName email');
  const plainTask = task.toObject();
  return { ...plainTask, _id: (plainTask._id as any).toString() };
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictError('Ya existe una tarea con ese título en el proyecto');
      }
      throw error;
    }
  }

  static async getTasks(filter: any, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('project', 'name description')
        .populate('assignedTo', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Task.countDocuments(filter)
    ]);

    return {
      tasks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTasks: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  static async getTaskById(id: string): Promise<ITask> {
    const task = await Task.findById(id);
    
    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    // Ahora sí puedes hacer populate porque sabes que task no es null
    const populatedTask = await task.populate([
      { path: 'project', select: 'name description owner' },
      { path: 'assignedTo', select: 'firstName lastName email' }
    ]);

    const plainTask = populatedTask.toObject();
    return { ...plainTask, _id: (plainTask._id as any).toString() };
  }

  static async updateTask(id: string, updates: UpdateTaskRequest): Promise<ITask> {
    if (updates.deadline) updates.deadline = new Date(updates.deadline);

    const task = await Task.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    // Hacer populate después de verificar que task no es null
    const populatedTask = await task.populate([
      { path: 'project', select: 'name description' },
      { path: 'assignedTo', select: 'firstName lastName email' }
    ]);

    const plainTask = populatedTask.toObject();
    return { ...plainTask, _id: (plainTask._id as any).toString() };
  }

  static async deleteTask(id: string): Promise<void> {
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }
  }

  static async checkTaskPermission(taskId: string, userId: string, userRole: string): Promise<boolean> {
    if (userRole === 'superadmin') return true;

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    const project = task.project as any;
    const isOwner = project.owner.toString() === userId;
    const isAssigned = task.assignedTo?.toString() === userId;

    if (!isOwner && !isAssigned) {
      throw new ForbiddenError('No tienes permisos para acceder a esta tarea');
    }

    return true;
  }

  static async getTasksByProject(projectId: string, userId: string, userRole: string, page: number, limit: number) {
    await ProjectService.checkProjectPermission(projectId, userId, userRole);
    const filter = { project: projectId };
    return this.getTasks(filter, page, limit);
  }

  
  static async getUserTasks(userId: string, userRole: string, filter: any = {}, page: number, limit: number) {
  
    if (userRole !== 'superadmin') {
      const userProjects = await Project.find({ owner: userId }).select('_id');
      const userProjectIds = userProjects.map(project => project._id);
      
      filter.$or = [
        { assignedTo: userId },
        { project: { $in: userProjectIds } }
      ];

      if (filter.project && !userProjectIds.includes(filter.project)) {
        const assignedTasksCount = await Task.countDocuments({ 
          project: filter.project, 
          assignedTo: userId 
        });
        
        if (assignedTasksCount === 0) {
          throw new ForbiddenError('No tienes permisos para ver tareas de este proyecto');
        }
      }
    }
    
    return this.getTasks(filter, page, limit);
  }
}