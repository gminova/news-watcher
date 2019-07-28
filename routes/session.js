//A module for session login and logout
"use strict";
const express = require('express');
const bcrypt = require('bycriptjs'); //for password hash comparing
const jwt = require('jwt-simple'); //for token authentication