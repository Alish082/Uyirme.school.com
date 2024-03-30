import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const zSurvey = z.object({
  desired_skills: z.array(z.string()),
  age_group: z.string(),
  location: z.string(),

  preferred_format: z.string(),
  preferred_days: z.array(z.string()),
  preferred_time: z.array(z.string()),
});

interface SkillData {
  desired_skills: string[];
  preferred_format: string;
}
type ReturnData = {name: string, online: number, offline: number}[]

// Function to get the top 5 names (skills) based on online count
function getTopSkills(data: ReturnData): ReturnData {
  // Sort the data based on online count in descending order
  const sortedData = data.sort((a, b) => (b.online + b.offline) - (a.online + a.offline));
  
  // Extract the top 5 names
  const topSkills = sortedData.slice(0, 5);
  
  return topSkills;
}

const countSkillsByFormat = (jsonData: SkillData[]): ReturnData => {
  const skillCounts: Record<string, { online: number; offline: number }> = {};

  jsonData.forEach((entry) => {
    const format = entry.preferred_format;
    entry.desired_skills.forEach((skill) => {
      if (!skillCounts[skill]) {
        skillCounts[skill] = { online: 0, offline: 0 };
      }
      skillCounts[skill]![format === "online" ? "online" : "offline"]++;
    });
  });

  return Object.keys(skillCounts).map((skill) => ({
    name: skill,
    online: skillCounts[skill]!.online,
    offline: skillCounts[skill]!.offline,
  }));
};

export const postRouter = createTRPCRouter({
  stats: publicProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.survey.findMany({
      select: {
        desired_skills: true,
        preferred_format: true
      }
    })
    const returnedData: ReturnData= getTopSkills(countSkillsByFormat(count))

    return {data: returnedData};
    
  }),

  create: protectedProcedure
    .input(z.object({ survey: zSurvey }))
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      const user = await ctx.db.survey.findFirst({where: {userId: ctx.auth.userId}})
      if (user) {
        throw new TRPCError({code: "CONFLICT"})
      }
      await ctx.db.survey.create({
        data: {
          userId: ctx.auth.userId,
          email: ctx.auth.user?.emailAddresses[0]?.emailAddress,
          desired_skills: input.survey.desired_skills,
          age_group: input.survey.age_group,
          location: input.survey.location,
          preferred_format: input.survey.preferred_format,
          preferred_days: input.survey.preferred_days,
          preferred_time: input.survey.preferred_time,
        },
      });
      return "OK";
    }),
});
