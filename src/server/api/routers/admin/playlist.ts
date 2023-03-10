import { protectedAdminProcedure } from "server/api/trpc";
import { z } from "zod";
import { createTRPCRouter } from "../../trpc";

export const playlistRouter = createTRPCRouter({
  create: protectedAdminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        picture: z.string().optional(),
        tracks: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              preview_url: z.string().url().nullable(),
              album: z.object({
                id: z.string(),
                name: z.string(),
                images: z.array(
                  z.object({
                    url: z.string().url(),
                    width: z.number().positive(),
                    height: z.number().positive(),
                  })
                ),
              }),
              artists: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                })
              ),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.playlist.create({
        data: {
          name: input.name,
          description: input.description,
          public: true,
          tracks: {
            connectOrCreate: input.tracks.map((track) => ({
              where: {
                id: track.id,
              },
              create: {
                id: track.id,
                name: track.name,
                preview_url: track.preview_url ?? undefined,
                album: {
                  connectOrCreate: {
                    where: {
                      id: track.album.id,
                    },
                    create: {
                      id: track.album.id,
                      name: track.album.name,
                      images: {
                        connectOrCreate: track.album.images.map((image) => ({
                          create: {
                            url: image.url,
                            width: image.width,
                            height: image.height,
                          },
                          where: {
                            url: image.url,
                          },
                        })),
                      },
                    },
                  },
                },
                artists: {
                  connectOrCreate:
                    track.artists.map((artist) => ({
                      create: {
                        id: artist.id,
                        name: artist.name,
                      },
                      where: {
                        id: artist.id,
                      },
                    })) ?? [],
                },
              },
            })),
          },
        },
      });
    }),
  edit: protectedAdminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        description: z.string().optional(),
        picture: z.string().optional(),
        tracks: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              preview_url: z.string().url().nullable(),
              album: z.object({
                id: z.string(),
                name: z.string(),
                images: z.array(
                  z.object({
                    url: z.string().url(),
                    width: z.number().positive(),
                    height: z.number().positive(),
                  })
                ),
              }),
              artists: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                })
              ),
            })
          )
          .min(1),
        removed_tracks: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.playlist.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          description: input.description,
          tracks: {
            disconnect: input.removed_tracks.map((track_id) => ({
              id: track_id,
            })),
            connectOrCreate: input.tracks.map((track) => ({
              where: {
                id: track.id,
              },
              create: {
                id: track.id,
                name: track.name,
                preview_url: track.preview_url ?? undefined,
                album: {
                  connectOrCreate: {
                    where: {
                      id: track.album.id,
                    },
                    create: {
                      id: track.album.id,
                      name: track.album.name,
                      images: {
                        connectOrCreate: track.album.images.map((image) => ({
                          create: {
                            url: image.url,
                            width: image.width,
                            height: image.height,
                          },
                          where: {
                            url: image.url,
                          },
                        })),
                      },
                    },
                  },
                },
                artists: {
                  connectOrCreate:
                    track.artists.map((artist) => ({
                      create: {
                        id: artist.id,
                        name: artist.name,
                      },
                      where: {
                        id: artist.id,
                      },
                    })) ?? [],
                },
              },
            })),
          },
        },
      });
    }),
  delete: protectedAdminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.playlist.deleteMany({
        where: {
          id: input.id,
          public: true,
        },
      });
    }),
  get_all: protectedAdminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.playlist.findMany({
      where: {
        public: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: true,
        tracks: {
          take: 10,
          include: {
            album: {
              include: {
                images: true,
              },
            },
            artists: true,
          },
        },
      },
    });
  }),
  get_playlist: protectedAdminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.playlist.findFirst({
        where: {
          id: input.id,
          public: true,
        },
        include: {
          tracks: {
            include: {
              album: {
                include: {
                  images: true,
                },
              },
              artists: true,
            },
          },
        },
      });
    }),
});
