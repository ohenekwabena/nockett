import { createClient } from '@/api/supabase/client';
import { Tables } from '@/types/database.types';

// Types based on database schema
export type User = Tables<'users'> & {
    department?: Tables<'departments'>;
    roles?: Tables<'roles'>[];
};

export type Assignee = Tables<'assignee'>;
export type Department = Tables<'departments'>;
export type Role = Tables<'roles'>;
export type UserRole = Tables<'user_roles'> & {
    role?: Tables<'roles'>;
};

export interface CreateUserData {
    name: string;
    email: string;
    department_id?: number;
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    department_id?: number;
}

const supabase = createClient();

// User CRUD Operations
export const userService = {
    // Create user
    async createUser(userData: CreateUserData): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select('*, departments(id, name)')
            .single();

        if (error) throw new Error(`Failed to create user: ${error.message}`);
        return data;
    },

    // Get user by ID
    async getUserById(id: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select(`
        *,
        departments(id, name),
        user_roles(
          id,
          role_id,
          assigned_at,
          roles(id, name)
        )
      `)
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to fetch user: ${error.message}`);
        }
        return data;
    },

    // Get all users
    async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
        let query = supabase
            .from('users')
            .select(`
        *,
        departments(id, name),
        user_roles(
          id,
          role_id,
          assigned_at,
          roles(id, name)
        )
      `)
            .order('created_at', { ascending: false });

        if (limit) query = query.limit(limit);
        if (offset) query = query.range(offset, offset + (limit || 10) - 1);

        const { data, error } = await query;

        if (error) throw new Error(`Failed to fetch users: ${error.message}`);
        return data || [];
    },

    // Get users by department
    async getUsersByDepartment(departmentId: number): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select(`
        *,
        departments(id, name),
        user_roles(
          id,
          role_id,
          assigned_at,
          roles(id, name)
        )
      `)
            .eq('department_id', departmentId)
            .order('name');

        if (error) throw new Error(`Failed to fetch users by department: ${error.message}`);
        return data || [];
    },

    // Update user
    async updateUser(id: string, updateData: UpdateUserData): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select('*, departments(id, name)')
            .single();

        if (error) throw new Error(`Failed to update user: ${error.message}`);
        return data;
    },

    // Delete user
    async deleteUser(id: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Failed to delete user: ${error.message}`);
    },

    // Search users by name or email
    async searchUsers(searchTerm: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select(`
        *,
        departments(id, name),
        user_roles(
          id,
          role_id,
          assigned_at,
          roles(id, name)
        )
      `)
            .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            .order('name');

        if (error) throw new Error(`Failed to search users: ${error.message}`);
        return data || [];
    },
};

// Assignee CRUD Operations
export const assigneeService = {
    // Create assignee
    async createAssignee(name: string): Promise<Assignee> {
        const { data, error } = await supabase
            .from('assignee')
            .insert([{ name }])
            .select()
            .single();

        if (error) throw new Error(`Failed to create assignee: ${error.message}`);
        return data;
    },

    // Get assignee by ID
    async getAssigneeById(id: number): Promise<Assignee | null> {
        const { data, error } = await supabase
            .from('assignee')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to fetch assignee: ${error.message}`);
        }
        return data;
    },

    // Get all assignees
    async getAllAssignees(): Promise<Assignee[]> {
        const { data, error } = await supabase
            .from('assignee')
            .select('*')
            .order('name');

        if (error) throw new Error(`Failed to fetch assignees: ${error.message}`);
        return data || [];
    },

    // Update assignee
    async updateAssignee(id: number, name: string): Promise<Assignee> {
        const { data, error } = await supabase
            .from('assignee')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update assignee: ${error.message}`);
        return data;
    },

    // Delete assignee
    async deleteAssignee(id: number): Promise<void> {
        const { error } = await supabase
            .from('assignee')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Failed to delete assignee: ${error.message}`);
    },
};

// Department CRUD Operations
export const departmentService = {
    // Create department
    async createDepartment(name: string): Promise<Department> {
        const { data, error } = await supabase
            .from('departments')
            .insert([{ name }])
            .select()
            .single();

        if (error) throw new Error(`Failed to create department: ${error.message}`);
        return data;
    },

    // Get department by ID
    async getDepartmentById(id: number): Promise<Department | null> {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to fetch department: ${error.message}`);
        }
        return data;
    },

    // Get all departments
    async getAllDepartments(): Promise<Department[]> {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .order('name');

        if (error) throw new Error(`Failed to fetch departments: ${error.message}`);
        return data || [];
    },

    // Update department
    async updateDepartment(id: number, name: string): Promise<Department> {
        const { data, error } = await supabase
            .from('departments')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update department: ${error.message}`);
        return data;
    },

    // Delete department
    async deleteDepartment(id: number): Promise<void> {
        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Failed to delete department: ${error.message}`);
    },

    // Get department users count
    async getDepartmentUsersCount(id: number): Promise<number> {
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', id);

        if (error) throw new Error(`Failed to get department users count: ${error.message}`);
        return count || 0;
    },
};

// Role CRUD Operations
export const roleService = {
    // Create role
    async createRole(name: string): Promise<Role> {
        const { data, error } = await supabase
            .from('roles')
            .insert([{ name }])
            .select()
            .single();

        if (error) throw new Error(`Failed to create role: ${error.message}`);
        return data;
    },

    // Get role by ID
    async getRoleById(id: number): Promise<Role | null> {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to fetch role: ${error.message}`);
        }
        return data;
    },

    // Get all roles
    async getAllRoles(): Promise<Role[]> {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .order('name');

        if (error) throw new Error(`Failed to fetch roles: ${error.message}`);
        return data || [];
    },

    // Update role
    async updateRole(id: number, name: string): Promise<Role> {
        const { data, error } = await supabase
            .from('roles')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update role: ${error.message}`);
        return data;
    },

    // Delete role
    async deleteRole(id: number): Promise<void> {
        const { error } = await supabase
            .from('roles')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Failed to delete role: ${error.message}`);
    },
};

// User Roles Management
export const userRoleService = {
    // Assign role to user
    async assignRoleToUser(userId: string, roleId: number): Promise<UserRole> {
        const { data, error } = await supabase
            .from('user_roles')
            .insert([{ user_id: userId, role_id: roleId }])
            .select('*, roles(id, name)')
            .single();

        if (error) throw new Error(`Failed to assign role to user: ${error.message}`);
        return data;
    },

    // Remove role from user
    async removeRoleFromUser(userId: string, roleId: number): Promise<void> {
        const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)
            .eq('role_id', roleId);

        if (error) throw new Error(`Failed to remove role from user: ${error.message}`);
    },

    // Get user roles
    async getUserRoles(userId: string): Promise<UserRole[]> {
        const { data, error } = await supabase
            .from('user_roles')
            .select('*, roles(id, name)')
            .eq('user_id', userId)
            .order('assigned_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch user roles: ${error.message}`);
        return data || [];
    },

    // Get users by role
    async getUsersByRole(roleId: number): Promise<User[]> {
        const { data, error } = await supabase
            .from('user_roles')
            .select(`
        user_id,
        users(
          *,
          departments(id, name)
        )
      `)
            .eq('role_id', roleId);

        if (error) throw new Error(`Failed to fetch users by role: ${error.message}`);

        // Fix the type mapping - properly extract and type the users
        return data?.map((item: any) => item.users as User).filter((user): user is User => user !== null) || [];
    },

    // Update user roles (remove all existing and add new ones)
    async updateUserRoles(userId: string, roleIds: number[]): Promise<UserRole[]> {
        // Remove existing roles
        const { error: deleteError } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId);

        if (deleteError) throw new Error(`Failed to remove existing roles: ${deleteError.message}`);

        // Add new roles
        if (roleIds.length === 0) return [];

        const userRoles = roleIds.map(roleId => ({ user_id: userId, role_id: roleId }));
        const { data, error } = await supabase
            .from('user_roles')
            .insert(userRoles)
            .select('*, roles(id, name)');

        if (error) throw new Error(`Failed to assign new roles: ${error.message}`);
        return data || [];
    },
};

// Utility functions
export const userUtils = {
    // Check if user has specific role
    async userHasRole(userId: string, roleName: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', userId)
            .eq('roles.name', roleName)
            .limit(1);

        if (error) return false;
        return data && data.length > 0;
    },

    // Get user's department name
    async getUserDepartmentName(userId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('users')
            .select('departments(name)')
            .eq('id', userId)
            .single();

        if (error || !data?.departments) return null;
        // Handle the fact that departments is a nested object from the relationship
        return Array.isArray(data.departments) ? data.departments[0]?.name || null : (data.departments as any).name || null;
    },

    // Get users count by department
    async getUsersCountByDepartment(): Promise<{ department: string; count: number }[]> {
        const { data, error } = await supabase
            .from('users')
            .select('department_id, departments(name)')
            .not('department_id', 'is', null);

        if (error) throw new Error(`Failed to get users count by department: ${error.message}`);

        const departmentCounts: { [key: string]: number } = {};
        data?.forEach((user: any) => {
            const departmentName = Array.isArray(user.departments)
                ? user.departments[0]?.name
                : user.departments?.name;
            if (departmentName) {
                departmentCounts[departmentName] = (departmentCounts[departmentName] || 0) + 1;
            }
        });

        return Object.entries(departmentCounts).map(([department, count]) => ({
            department,
            count,
        }));
    },
};
// Get users count by department

