#!/usr/bin/env make

SHELL := /bin/bash

ENV ?=

up:
	$(UP_CMD)
.PHONY: up