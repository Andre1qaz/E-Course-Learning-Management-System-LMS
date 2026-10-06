@echo off
SET "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "C:\Users\andre\OneDrive\Documents\GitHub\E-Course-Learning-Management-System-LMS\backend"
"C:\Program Files\nodejs\npx.cmd" prisma db push
