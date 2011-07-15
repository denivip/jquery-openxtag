
# makefile from jquery sources

SRC_DIR = src
TEST_DIR = test
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist

JS_ENGINE ?= `which node nodejs`
COMPILER = ${JS_ENGINE} ${BUILD_DIR}/uglify.js --unsafe
CLOSURE_COMPILER = java -jar ~/Applications/closure-compiler/compiler.jar

BASE_FILES = ${SRC_DIR}/jquery.openxtag.js

MODULES = ${BASE_FILES}

JQ = ${DIST_DIR}/jquery.openxtag.js
JQ_MIN = ${DIST_DIR}/jquery.openxtag.min.js
JQ_CC = ${DIST_DIR}/jquery.openxtag.cc.js

JQ_VER = $(shell cat version.txt)
VER = sed "s/@VERSION/${JQ_VER}/"
TGZ = ./jquery-openxtag-${JQ_VER}

DATE=$(shell git log -1 --pretty=format:%ad)

all: core ${TGZ}.tar.gz

core: jquery min lint
	@@echo "Plugin build complete."

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}
	@@cp -r README.md lib examples ${DIST_DIR}

jquery: ${JQ}

${JQ}: ${MODULES} | ${DIST_DIR}
	@@echo "Building" ${JQ}

	@@cat ${MODULES} | \
		sed 's/@DATE/'"${DATE}"'/' | \
		${VER} > ${JQ};

${TGZ}.tar.gz: ${DIST_DIR}
	@@rm -rf ${TGZ} ${TGZ}.tar.gz ${TGZ}.zip
	@@cp -r ${DIST_DIR} ${TGZ}
	@@tar cfz ${TGZ}.tar.gz ${TGZ}
	@@zip -r ${TGZ}.zip ${TGZ}

lint: jquery
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Checking plugin against JSLint..."; \
		${JS_ENGINE} build/jslint-check.js; \
	else \
		echo "You must have NodeJS installed in order to test plugin against JSLint."; \
	fi

min: jquery ${JQ_MIN} ${JQ_CC}

${JQ_MIN}: ${JQ}
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Minifying plugin" ${JQ_MIN}; \
		${COMPILER} ${JQ} > ${JQ_MIN}; \
	else \
		echo "You must have NodeJS installed in order to minify plugin."; \
	fi
	
${JQ_CC}: ${JQ}
	@@echo "Closure compiling plugin" ${JQ_CC}; \
	${CLOSURE_COMPILER} --compilation_level ADVANCED_OPTIMIZATIONS --js ${JQ} \
	--externs lib/jquery-1.6.2rc1-ab1504f.min.js --externs lib/jquery.metadata.js \
	--warning_level QUIET > ${JQ_CC};

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR} ${TGZ} ${TGZ}.tar.gz
	@@rm -rf ${DIST_DIR}
	@@rm -rf ${TGZ} ${TGZ}.tar.gz ${TGZ}.zip

.PHONY: all jquery lint min clean core
