echo off
netstat -aon | find /i "listening" | find /i ":%1"