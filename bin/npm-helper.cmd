@ECHO OFF

set olddir=%CD%
cd %1

FOR %%A IN (%*) DO (
	IF %%A == %1 (
	  set cwd=%%A
	) ELSE IF %%A == %2 (
	  set ow=%%A
	) ELSE (
	  echo npm link %%A
	)
)

echo %cmd%
cd %olddir%

@ECHO ON