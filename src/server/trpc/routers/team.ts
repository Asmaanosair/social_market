import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../index";
import { db } from "@/server/db";

export const teamRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Find team where user is a member or owner
    const membership = await db.teamMember.findFirst({
      where: { userId },
      include: {
        team: {
          include: {
            owner: {
              select: { id: true, name: true, email: true, image: true },
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true, role: true },
                },
              },
              orderBy: { joinedAt: "asc" },
            },
          },
        },
      },
    });

    if (!membership) {
      // Check if user owns a team
      const ownedTeam = await db.team.findFirst({
        where: { ownerId: userId },
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true, role: true },
              },
            },
            orderBy: { joinedAt: "asc" },
          },
        },
      });

      return ownedTeam;
    }

    return membership.team;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(50),
        slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check if slug is taken
      const existing = await db.team.findUnique({ where: { slug: input.slug } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Team slug already taken" });
      }

      // Check if user already owns a team
      const ownedTeam = await db.team.findFirst({ where: { ownerId: userId } });
      if (ownedTeam) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already own a team. Delete it first to create a new one.",
        });
      }

      const team = await db.team.create({
        data: {
          name: input.name,
          slug: input.slug,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: "SUPER_ADMIN",
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      await db.auditLog.create({
        data: {
          userId,
          action: "CREATE_TEAM",
          entity: "Team",
          entityId: team.id,
          metadata: { name: input.name, slug: input.slug },
        },
      });

      return team;
    }),

  invite: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["TEAM_MANAGER", "CONTENT_CREATOR", "ANALYST"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get the user's team
      const team = await db.team.findFirst({
        where: { ownerId: userId },
      });

      if (!team) {
        throw new TRPCError({ code: "NOT_FOUND", message: "You don't own a team" });
      }

      // Find the invited user
      const invitedUser = await db.user.findUnique({
        where: { email: input.email },
      });

      if (!invitedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found. They need to create an account first.",
        });
      }

      // Check if already a member
      const existingMember = await db.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: invitedUser.id } },
      });

      if (existingMember) {
        throw new TRPCError({ code: "CONFLICT", message: "User is already a team member" });
      }

      const member = await db.teamMember.create({
        data: {
          teamId: team.id,
          userId: invitedUser.id,
          role: input.role,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      // Update user role
      await db.user.update({
        where: { id: invitedUser.id },
        data: { role: input.role },
      });

      await db.auditLog.create({
        data: {
          userId,
          action: "INVITE_TEAM_MEMBER",
          entity: "TeamMember",
          entityId: member.id,
          metadata: { invitedEmail: input.email, role: input.role },
        },
      });

      return { success: true, member };
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const member = await db.teamMember.findUnique({
        where: { id: input.memberId },
        include: { team: true },
      });

      if (!member) throw new TRPCError({ code: "NOT_FOUND" });

      // Only team owner can remove members
      if (member.team.ownerId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the team owner can remove members" });
      }

      // Cannot remove yourself (owner)
      if (member.userId === userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove yourself from the team" });
      }

      await db.teamMember.delete({ where: { id: input.memberId } });

      // Reset user role
      await db.user.update({
        where: { id: member.userId },
        data: { role: "CONTENT_CREATOR" },
      });

      return { success: true };
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["TEAM_MANAGER", "CONTENT_CREATOR", "ANALYST"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const member = await db.teamMember.findUnique({
        where: { id: input.memberId },
        include: { team: true },
      });

      if (!member) throw new TRPCError({ code: "NOT_FOUND" });

      if (member.team.ownerId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the team owner can change roles" });
      }

      await db.teamMember.update({
        where: { id: input.memberId },
        data: { role: input.role },
      });

      await db.user.update({
        where: { id: member.userId },
        data: { role: input.role },
      });

      return { success: true };
    }),
});
