import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { privateProcedure, publicProcedure, router } from './trpc'
import { TRPCError } from '@trpc/server'
import { db } from '@/db'
import { z } from 'zod'
import { UTApi } from 'uploadthing/server'

const utapi = new UTApi()

export const appRouter = router({
  // auth callback
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user?.id || !user?.email) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
      })
    }

    // check if user is in db
    const dbUser = await db.user.findUnique({
      where: {
        id: user.id,
      },
    })

    if (!dbUser) {
      // create user
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      })
    }

    return {
      success: true,
    }
  }),

  // get user files
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId, user } = ctx

    return await db.file.findMany({
      where: {
        userId,
      },
    })
  }),

  // delete user file
  deleteFile: privateProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx

      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      })

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
        })
      }

      await db.file.delete({
        where: {
          id: input.id,
        },
      })

      // delete from uploadthing
      await utapi.deleteFiles([file.key])

      return {
        success: true,
      }
    }),

  // get a file
  getFile: privateProcedure
    .input(
      z.object({
        key: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx

      const file = await db.file.findFirst({
        where: {
          key: input.key,
          userId,
        },
      })

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
        })
      }

      return file
    }),
})
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter
