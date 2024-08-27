#!/bin/bash
#
# Copyright (c) 2024 ETロボコン実行委員会, Released under the MIT license
# See LICENSE
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
    # compesys startup
	nohup  npm run start > ${LOGDIR}/out.log 2>/dev/null & 
	sleep 3
	showMessage "compesys boot check .."
	health_check=`curl --no-progress-meter -X GET http://localhost:1080/version -o /dev/null -w '%{http_code}\n'`
	code=`echo "$health_check"`
	count=0
	while [ "$code" != "200" ] && [ $count -lt 10 ]; do 
		count=$(( $count + 1 ))
		sleep 1  
		health_check=`curl --no-progress-meter -X GET http://localhost:1080/version -o /dev/null -w '%{http_code}\n'`
		code=`echo "$health_check"`
	done
	if [ $count -lt 10 ]; then 
		nohup  sudo systemctl start nginx > ${LOGDIR}/out.log 2>/dev/null & 
		sleep 3
		showMessage "nginx connected check .."
		connected_check=`curl --no-progress-meter -X GET http://localhost/version -o /dev/null -w '%{http_code}\n'`
		code=`echo "$connected_check"`
		count=0
		while [ "$code" != "200" ] && [ $count -lt 10 ]; do
			echo "[HTTP_CODE : $code ]"
			# Stopping due to connection failure
			sudo systemctl stop nginx > /dev/null
			# Increment retry count
			count=$(( $count + 1 ))
			sleep 2
			# Try to start nginx again.
			nohup  sudo systemctl start nginx > ${LOGDIR}/out.log 2>/dev/null & 
			# Wait for startup
			sleep 2
			connected_check=`curl --no-progress-meter -X GET http://localhost/version -o /dev/null -w '%{http_code}\n'`
			code=`echo "$connected_check"`
		done
		if [ $count -lt 10 ]; then 
			showMessage "compesys started."
		else
			# nginx start failure
			showMessage "compesys startup failure"
			stopProc 
			showMessage "Please Run \`start\` again."
			return 1
		fi 
	else
	# npm start failure
		showMessage "compesys startup failure"
		stopProc 
		showMessage "Please Run \`start\` again."
		return 1
	fi
	cd ${oldDir}
	return 0
}

function stopProc() {

	sudo systemctl stop nginx > /dev/null  
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

