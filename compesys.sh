#!/bin/bash
#

BASEDIR=/opt/compesys
LOGDIR=/var/log/compesys
APLNAME=app.js


function showUsage() {
	echo "Usage: `basename $0` [start|stop|status]"
	return 0
}

function showMessage() {
	echo "[`date '+%Y/%m/%d %T'`]$1"
	return 0
}


function startProc() {
	CHK_VAL=`pgrep -fo "${APLNAME}" | wc -l`
	if [ ${CHK_VAL} -ne 0 ]; then
		showMessage "compesys is already started."
	 	exit 1
	fi

	oldDir=${PWD}

	if [ ! "${PWD}" = "${BASEDIR}" ]; then
		cd ${BASEDIR}
	fi

	# clean nohup.out
	cp /dev/null ${BASEDIR}/nohup.out

	nohup  sudo npm run start > ${LOGDIR}/out.log 2>/dev/null & 
	sleep 3
	showMessage "compesys started." 

	cd ${oldDir}
	return 0
}

function stopProc() {

	CHK_VAL=`pgrep -fo "${APLNAME}"`

	if [ "x${CHK_VAL}" = "x" ] ;then
		showMessage "compesys has already been stopped." 
	fi

	CHK_VAL=`pgrep -fo "${APLNAME}"`

	for pid in ${CHK_VAL} ; do
		sudo kill ${pid} >/dev/null 
	done

	CHK_VAL=`pgrep -fo "${APLNAME}"`

	if [ "x${CHK_VAL}" = "x" ] ;then
		return 0
	fi
	for pid in ${CHK_VAL} ; do
		sudo kill -KILL ${pid} >/dev/null 
	done

	showMessage "compesys stopped." 
	return 0
}

function showStatus() {
	CHK_VAL=`pgrep -fo "${APLNAME}"`

	if [ "x${CHK_VAL}" = "x" ]; then
		showMessage "compesys not running."
		return 0
	fi

	echo "**************************  process info   ***************************" 
	ps -ef | grep "${APLNAME}" | grep -v grep 
	echo "************************** listen port info **************************"
 	sudo lsof -i -anP  | grep ":80"	
	return 0
}

#--------------------------------------------------------------
# Argument Check
#--------------------------------------------------------------
if [ $# -ne 1 ]; then
	showUsage
	exit 1
fi

#--------------------------------------------------------------
# main process
#--------------------------------------------------------------
if [ "${1}" = "start" ]; then
	startProc
	
elif [ "${1}" = "stop" ]; then 
	stopProc

elif [ "${1}" = "status" ]; then 
	showStatus
else
	showUsage
	exit 1
fi

exit 0

