import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  if (await prisma.quiz.count()) return;
  await prisma.quiz.create({data:{title:"Sample Data Literacy Quiz",source:"Seed data",questions:{create:[
    {question:"Which measure represents the middle value of an ordered dataset?",optionsJson:JSON.stringify(["Mean","Median","Mode","Range"]),correctAnswer:1,order:0},
    {question:"Which chart is generally suitable for showing a trend over time?",optionsJson:JSON.stringify(["Line chart","Pie chart","Icon list","Single-value card"]),correctAnswer:0,order:1},
    {question:"What does a percentage express?",optionsJson:JSON.stringify(["A value per hundred","A value per thousand","A raw count only","A date"]),correctAnswer:0,order:2}
  ]}}});
}
main().catch(console.error).finally(()=>prisma.$disconnect());
