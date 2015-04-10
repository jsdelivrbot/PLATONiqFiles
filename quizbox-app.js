(function() {
    var gKBV = function(o, value) {
        for(var prop in o) {
            if(o.hasOwnProperty(prop)) {
                if(o[prop] === value) return prop;
            }
        }
    }
    var app = function(path) {
        //This app
        //has an inordinate amount of
        //swiggitySwag
        var fb = new Firebase("https://quizbox.firebaseIO.com/");
        var paginate = function(page) {
            $('.page').hide().css({
                scale: 0
            }).removeClass("selected");
            $(page).show().transition({
                scale: 1
            }).addClass("selected");
            if(fb.getAuth()) {
                $('#logoutNav').slideDown();
            } else {
                $('#logoutNav').slideUp();
            }
        };
        var setTitle = function(prefix) {
            $('title').html(prefix + " - PLATONIq - QZ");
        }
        var loginCutoff = function() {
            if(!fb.getAuth()) {
                location.assign("/login");
            }
        };
        paginate("#main");
        var hash = location.hash;
        var loadDashData, doManage, doJoinClass, doNewQuiz, doNewQuestion, doManageQuiz, doRemoveClass, doRemoveQuestion, doRemoveQuiz, router, doColours, doNewClass, startQuiz, loginTo, pRS, doManageQuestion;
        router = new Router({
            "/": function() {
                paginate("#main");
            },
            "/login": function() {
                if(!fb.getAuth()) {
                    setTitle("Log in");
                    paginate("#login");
                    $('#login').transition({
                        scale: 1
                    });
                } else {
                    router.setRoute("/dash");
                }
            },
            "/logout": function() {
                fb.unauth();
                location.assign("/");
                setTitle("Logging out...");
            },
            "/dash": function() {
                paginate("#dash");
                setTitle("User Dashboard");
                if(fb.getAuth()) {
                    loadDashData();
                } else {
                    router.setRoute("/login");
                }
            },
            "/manage/:name": function(name) {
                paginate("#manageClass");
                setTitle("Managing class " + name);
                $('.className').text(name);
                doManage(name);
            },
            "/manage/:className/q/:quizName": function(className, quizName) {
                setTitle("Managing quiz " + quizName);
                paginate("#manageQuiz");
                doManageQuiz(className, quizName);
            },
            "/manage/:className/q/:quizName/:que": function(className, quizName, que) {
                setTitle("Managing question " + que);
                paginate("#manageQuestion");
                doManageQuestion(className, quizName, que);
            },
            "/quiz/:qID": function(qID) {
                setTitle("Taking quiz " + qID);
                paginate("#quiz");
                if(fb.getAuth()) {
                    startQuiz(qID);
                } else {
                    router.setRoute("/login");
                }
            }
        });
        router.configure({
            html5history: true
        });
        pRS = function(z) {
            router.setRoute(z);
        };
        var rectifyLinks = function() {
            $('a.rL').off("click").click(function(e) {
                e.preventDefault();
                var href = $(this).attr("href");
                router.setRoute(href);
            });
        };
        rectifyLinks();
        var view = path.split("/")[1];
        $('#loginButton').click(function() {
            fb.authWithOAuthPopup("google", function(error, authData) {
                if(error) {
                    $.snackbar({
                        content: "Login failed: " + error
                    });
                } else {
                    router.setRoute("/dash");
                    fb.child("users/" + fb.getAuth().uid + "/name").once("value", function(nameSnap) {
                        var name = nameSnap.val();
                        if(!name) {
                            fb.child("users/" + fb.getAuth().uid).update({
                                name: fb.getAuth().google.displayName
                            });
                        }
                    });
                }
            });
        });
        doRemoveClass = function(name) {
            var classPath = fb.child("teachers/" + name);
            bootbox.confirm("Are you sure you would like to delete class " + name + "? This is an action which cannot be undone.", function(result) {
                if(result == true) {
                    fb.child("users/" + fb.getAuth().uid).child("class/" + name).remove(function(err) {
                        if(err) {
                            $.snackbar({
                                content: err
                            });
                        } else {
                            classPath.remove(function(err) {
                                if(err) {
                                    //to err is human
                                    $.snackbar({
                                        content: err
                                    });
                                } else {
                                    $.snackbar({
                                        content: "Class deleted."
                                    });
                                    router.setRoute("/dash");
                                }
                            });
                        }
                    });
                } else {}
            });
        };
        doManage = function(name) {
            loginCutoff();
            $('.manRendered').remove();
            $('#currClass').val(name);
            var classPath = fb.child("teachers/" + name);
            classPath.child("pub").once("value", function(doesExist) {
                if(doesExist.val() != null) {
                    classPath.once("value", function(c) {
                        $('.className').text(name);
                        var quiz = c.val().quiz;
                        for(var q in quiz) {
                            $("<div class='col-md-4 manRendered'><div class='panel panel-default'><div class='panel-body'><h3>" + quiz[q].name + "</h3><br><a class='btn btn-primary rL' href='/manage/" + name + "/q/" + q + "'>Go</a>&nbsp;<button class='btn btn-success setLive' data-qN='" + q + "'>Go live.</button></div></div></div>").css({
                                scale: 0
                            }).appendTo('#manageCardboard').transition({
                                scale: 1
                            });
                        }
                        $('.setLive').off("click").click(function() {
                            var $el = $(this);
                            var quizName = $el.attr("data-qN");
                            classPath.child("currentQuiz").set(quizName, function() {
                                $.snackbar({
                                    content: "Live quiz set."
                                })
                            });
                        });
                        $('#resetLive').off("click").click(function() {
                            classPath.child("currentQuiz").remove(function(err) {
                                if(err) {
                                    //to err is human
                                    $.snackbar({
                                        content: err
                                    });
                                } else {
                                    $.snackbar({
                                        content: "Live quiz unset."
                                    });
                                }
                            });
                        });
                        $('#deleteClass').off("click").click(function() {
                            doRemoveClass(name);
                        });
                        rectifyLinks();
                    });
                } else {
                    router.setRoute("/dash");
                }
            });
        };
        doJoinClass = function() {
            loginCutoff();
            if($('#joinClassID').val().split(" ").join("") != "") {
                router.setRoute("/quiz/" + $('#joinClassID').val());
            } else {
                $("#joinClassID").focus();
            }
        };
        $('#joinClassDo').click(doJoinClass);
        $('#joinClassID').keydown(function(e) {
            if(e.keyCode == 13) {
                doJoinClass();
            }
        });
        doManageQuiz = function(className, quizName) {
            loginCutoff();
            $('.questionInList').remove();
            var classPath = fb.child("teachers/" + className);
            var quizPath = classPath.child("quiz/" + quizName);
            quizPath.once("value", function(quizSnap) {
                var quiz = quizSnap.val();
                if(quiz != null) {
                    $('.className').text(className);
                    $('.quizName').text(quiz.name);
                    $('#currQuiz').val(quizName);
                    $('#currClass').val(className);
                    $('#backToClass').attr('href', "/manage/" + className);
                    $('#quizResponsesButton').attr('href', "/responses/" + className + "/" + quizName);
                    for(var que in quiz.question) {
                        $('#questionList').append("<li class='list-group-item questionInList'><b>" + quiz.question[que].content.num + "</b>: " + quiz.question[que].content.query + "</b> <a href='/responses/" + className + "/" + quizName + "/" + que + "' class='btn btn-primary'>Responses</a> <a class='rL btn btn-info' href='/manage/" + className + "/q/" + quizName + "/" + que + "'>Edit</a></li>");
                    }
                    $('#removeQuizDo').off("click").click(function() {
                        doRemoveQuiz(className, quizName);
                    });
                    rectifyLinks();
                } else {
                    router.setRoute("/manage/" + className);
                    $.snackbar({
                        content: "Quiz does not exist."
                    });
                }
            });
        };
        var fixNumbers = function(className, quizName) {
            var classPath = fb.child("teachers/" + className);
            var quizPath = classPath.child("quiz/" + quizName);
            var quesPath = quizPath.child("question");
            var fN = function(num, id) {
                quesPath.child(id + "/content/num").set(num);
            };
            quesPath.once("value", function(quesSnap) {
                var ques = quesSnap.val();
                var qs = [];
                for(var q in ques) {
                    qs.push(q);
                }
                for(var q in qs) {
                    fN(parseInt(q) + 1, qs[q]);
                }
                router.setRoute("/manage/" + className + "/q/" + quizName);
            });
        };
        doManageQuestion = function(className, quizName, que) {
            loginCutoff();
            //RESET UI
            $('.multChoiceChoice').remove();
            $('#editQuestion').text('');
            $('#queMultchoiceEnabled, #queCaseSens').attr("checked", "false");
            //PATH NONSENSE
            var classPath = fb.child("teachers/" + className);
            var quizPath = classPath.child("quiz/" + quizName);
            var quePath = quizPath.child("question/" + que);
            $('#backToClassFQ').attr("href", "/manage/" + className);
            $('#backToQuiz').attr("href", "/manage/" + className + "/q/" + quizName);
            quizPath.child("name").once("value", function(quizNameSnap) {
                $('.quizName').text(quizNameSnap.val());
            });
            //POPULATE UI
            var saveQue;
            var delH = function() {
                $('.deleteMC').off("click").click(function() {
                    var $el = $(this);
                    $el.parent().remove();
                    saveQue();
                });
            };
            quePath.once("value", function(queSnap) {
                if(queSnap.val() != null) {
                    $('#currQue').val(que);
                    $('#currQuiz').val(quizName);
                    $('#currClass').val(className);
                    $('.className').text(className);
                    var question = queSnap.val();
                    $('.queNum').text(question.content.num);
                    var query = question.content.query;
                    var settings = question.content.settings;
                    $('#editQuestion').val(query);
                    $('#queMultchoiceEnabled').attr("checked", (question.content.settings.multChoice || false));
                    if(question.content.settings.multChoice) {
                        $('#manMultChoiceChoices').slideDown();
                        var multChoices = [];
                        for(var choice in question.content.settings.multChoices) {
                            multChoices.push([choice, question.content.settings.multChoices[choice]]);
                        }
                        multChoices.sort(function(a, b) {
                            return a[0] - b[0];
                        });
                        for(var c in multChoices) {
                            $('#mMCC').prepend("<li class='multChoiceChoice list-group-item'><input type='text' class='key' value='" + multChoices[c][0] + "' disabled> : <input type='text' class='val' value='" + multChoices[c][1] + "' disabled> | <button class='btn btn-danger deleteMC'>Delete</button>");
                        }
                        delH();
                    } else {
                        $('#manMultChoiceChoices').slideUp();
                    }
                    $('#checkDontCheck').attr("checked", !(question.content.settings.checkAnswers || false));
                    $('#checkKeyTerms').attr("checked", (question.content.settings.keyTerm || false));
                    $('#checkCorrectAnswer').attr("checked", (question.content.settings.correctAnswer || false));
                    if(!$('#checkCorrectAnswer').is(":checked")) {
                        $('#queCorAns').attr("disabled", "true");
                    } else {
                        $('#queCorAns').removeAttr("disabled");
                    }
                    if(!$('#checkKeyTerms').is(":checked")) {
                        $('#queKeyTerms').attr("disabled", "true");
                    } else {
                        $('#queKeyTerms').removeAttr("disabled");
                    }
                    $('#queKeyTerms').val((question.keyTerms || []).join(","));
                    $('#queCorAns').val(question.correctAnswer);
                    $('#thChbx').off("click").click(function() {
                        if($('#queMultchoiceEnabled').is(":checked")) {
                            $('#manMultChoiceChoices').slideDown();
                        } else {
                            $('#manMultChoiceChoices').slideUp();
                        }
                    });
                    $('*[name="aC"]:radio').off("change").on("change", function() {
                        if(!$('#checkCorrectAnswer').is(":checked")) {
                            $('#queCorAns').attr("disabled", "true");
                        } else {
                            $('#queCorAns').removeAttr("disabled");
                        }
                        if(!$('#checkKeyTerms').is(":checked")) {
                            $('#queKeyTerms').attr("disabled", "true");
                        } else {
                            $('#queKeyTerms').removeAttr("disabled");
                        }
                    });
                    $('#newMultChoice').off("click").click(function() {
                        $('#mMCC').prepend("<li class='multChoiceChoice list-group-item'><input type='text' class='key'> : <input type='text' class='val'> | <button class='btn btn-danger deleteMC'>Delete</button></li>");
                        delH();
                    });
                } else {
                    router.setRoute("/manage/" + className + "/q/" + quizName);
                }
            });
            //OH NOES, EVENT HANDLERS :(
            saveQue = function() {
                var classPath = fb.child("teachers/" + $('#currClass').val());
                var quizPath = classPath.child("quiz/" + $('#currQuiz').val());
                var quePath = quizPath.child("question/" + $('#currQue').val());
                //Assemble object
                quePath.once("value", function(oQS) {
                    var que = oQS.val();
                    que.content.query = $('#editQuestion').val();
                    //MULT-CHOICE
                    if($('#queMultchoiceEnabled').is(":checked")) {
                        que.content.settings.multChoice = true;
                        que.content.settings.multChoices = {};
                        $('.multChoiceChoice').each(function(index, $el) {
                            var val = $($el).children('.val').val();
                            var key = $($el).children('.key').val();
                            que.content.settings.multChoices[key] = val;
                        });
                    } else {
                        que.content.settings.multChoice = false;
                    }
                    //CASE SENSITIVITY
                    que.content.settings.checkAnswers = !($('#checkDontCheck').is(":checked"));
                    que.content.settings.correctAnswer = $('#checkCorrectAnswer').is(":checked");
                    que.content.settings.keyTerm = $('#checkKeyTerms').is(":checked");
                    if(que.content.settings.keyTerm) {
                        que.keyTerms = ($('#queKeyTerms').val().split(" ").join("").split(",") || []);
                    }
                    if(que.content.settings.correctAnswer) {
                        que.correctAnswer = ($('#queCorAns').val() || "");
                    }
                    quePath.update(que, function(err) {
                        if(err) {
                            $.snackbar({
                                content: err
                            });
                        } else {
                            $.snackbar({
                                content: "Saved successfully."
                            });
                        }
                    });
                });
            };
            $('#manageSaveQueDo').off("click").click(saveQue);
            rectifyLinks();
        };
        doNewQuiz = function(classID, name) {
            loginCutoff();
            var classPath = fb.child("teachers/" + classID);
            var quizzesPath = classPath.child("quiz");
            var quizToPush = {
                name: name
            };
            var quizPathname = quizzesPath.push(quizToPush).key();
            var quizPath = quizzesPath.child(quizPathname);
            var fQID = quizPath.child("question").push({
                content: {
                    settings: {
                        caseSensitive: false,
                        multChoices: {
                            "A": "",
                            "B": "",
                            "C": "",
                            "D": ""
                        }
                    },
                    num: 1,
                    query: "First Question"
                },
                correctAnswer: ""
            }).key();
            quizPath.child("firstQuestion").set(fQID);
            router.setRoute("/manage/" + classID + "/q/" + quizPathname);
        };
        $('#makeQuizID').keydown(function(e) {
            if(e.keyCode == 13) {
                if($('#makeQuizID').val().split(" ").join("") != "") {
                    doNewQuiz($('#currClass').val(), $('#makeQuizID').val());
                } else {
                    $('#makeQuizID').focus();
                }
            }
        });
        $('#makeQuizDo').click(function() {
            if($('#makeQuizID').val().split(" ").join("") != "") {
                doNewQuiz($('#currClass').val(), $('#makeQuizID').val());
            } else {
                $('#makeQuizID').focus();
            }
        });
        doNewQuestion = function(classID, quizID) {
            loginCutoff();
            var classPath = fb.child("teachers/" + classID);
            var quizPath = classPath.child("quiz/" + quizID);
            var num;
            quizPath.child("question").once("value", function(quizSnap) {
                if(quizSnap.val() == null) {
                    num = 1;
                } else {
                    num = Object.keys(quizSnap.val()).length + 1;
                }
                var newQuestionKey = quizPath.child("question").push({
                    correctAnswer: " ",
                    content: {
                        query: "Question #" + num,
                        num: num,
                        settings: {
                            multChoice: false,
                            checkAnswers: false,
                            caseSensitive: false,
                            multChoices: {
                                "A": " ",
                                "B": " ",
                                "C": " ",
                                "D": " "
                            }
                        }
                    }
                }).key();
                if(num != 1) {
                    var prevQue = Object.keys(quizSnap.val())[num - 2];
                    quizPath.child("question/" + prevQue + "/next").set(newQuestionKey);
                }
                router.setRoute("/manage/" + classID + "/q/" + quizID + "/" + newQuestionKey);
                $.snackbar({
                    content: "Question created."
                });
            });
        };
        $('#newQueDo').click(function() {
            doNewQuestion($('#currClass').val(), $('#currQuiz').val());
        });
        doRemoveQuiz = function(classID, quizID) {
            var classPath = fb.child("teachers/" + classID);
            var quizPath = classPath.child("quiz/" + quizID);
            quizPath.child("name").once("value", function(quizNameSnap) {
                var quizName = quizNameSnap.val();
                bootbox.confirm("Are you sure you would like to delete quiz " + quizName + "? This is an action that cannot be undone.", function(result) {
                    if(result == true) {
                        classPath.child("currentQuiz").once("value", function(cQSnap) {
                            if(cQSnap.val() == quizID) {
                                classPath.child("currentQuiz").remove();
                            }
                            quizPath.remove(function(e) {
                                if(!e) {
                                    $.snackbar({
                                        content: "Quiz " + quizName + " deleted."
                                    });
                                    router.setRoute("/manage/" + classID);
                                } else {
                                    $.snackbar({
                                        content: e
                                    });
                                }
                            });
                        });
                    }
                });
            });
        };
        doRemoveQuestion = function(classID, quizID, queID) {
            var gNQID = function(queID, context) {
                var contextKeys = Object.keys(context);
                var quePlace = parseInt(gKBV(contextKeys, queID));
                var nQP = quePlace + 1;
                return contextKeys[nQP];
            };
            var gPQID = function(queID, context) {
                var contextKeys = Object.keys(context);
                var quePlace = parseInt(gKBV(contextKeys, queID));
                var nQP = quePlace - 1;
                return contextKeys[nQP];
            };
            var classPath = fb.child("teachers/" + classID),
                quizPath = classPath.child("quiz/" + quizID),
                quePath = quizPath.child("question/" + queID),
                contextPath = quizPath.child("question"),
                isFirst = false,
                isLast = false,
                resolveNumbers = true;
            quizPath.child("firstQuestion").once("value", function(fQSnap) {
                var fQID = fQSnap.val();
                if(fQSnap.val() == queID) {
                    isFirst = true;
                }
                contextPath.once("value", function(contextSnap) {
                    var context = contextSnap.val();
                    var contextKeys = Object.keys(context);
                    if(contextKeys.length != 1) {
                        var quePlace = parseInt(gKBV(contextKeys, queID));
                        if(contextKeys.length == quePlace + 1) {
                            isLast = true;
                        }
                        var prevID, nextID;
                        nextID = gNQID(queID, context);
                        prevID = gPQID(queID, context);
                        if(!isLast && !isFirst) {
                            contextPath.child(prevID + "/next").set(nextID);
                        } else if(isLast) {
                            contextPath.child(prevID + "/next").remove();
                        } else if(isFirst) {
                            quizPath.child("firstQuestion").set(nextID);
                        }
                        quePath.remove(function() {
                            fixNumbers(classID, quizID);
                            $.snackbar({
                                content: "Question #" + (quePlace + 1) + " successfully deleted."
                            });
                        });
                        //quePath.remove();
                    } else {
                        $.snackbar({
                            content: "You can't delete the only question!"
                        });
                    }
                });
            });
        };
        $('#deleteQue').click(function() {
            bootbox.confirm("Are you sure you would like to delete this question?", function(result) {
                if(result == true) {
                    var className = $('#currClass').val();
                    var quizName = $('#currQuiz').val();
                    var queName = $('#currQue').val();
                    doRemoveQuestion(className, quizName, queName);
                }
            });
        });
        doNewClass = function(name) {
            if(fb.getAuth()) {
                bootbox.confirm("Would you like to create a class with the name " + name + "?", function(result) {
                    if(result == true) {
                        fb.child("teachers/" + name + "/pub").once("value", function(pubSnap) {
                            if(pubSnap.val() != null) {
                                $.snackbar({
                                    content: "Class already exists."
                                });
                            } else {
                                fb.child("teachers/" + name).update({
                                    pub: true,
                                    owner: fb.getAuth().uid
                                }, function(err) {
                                    if(err) {
                                        $.snackbar({
                                            content: err
                                        });
                                    } else {
                                        $.snackbar({
                                            content: "Class created."
                                        });
                                        fb.child("users/" + fb.getAuth().uid + "/class/" + name).set({
                                            "path": "/teachers/" + name
                                        });
                                        router.setRoute("/manage/" + name);
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                location.assign("/login");
            }
        };
        $('#makeClassID').keydown(function(e) {
            if(e.keyCode == 13) {
                if($('#makeClassID').val().split(" ").join("") != "") {
                    doNewClass($('#makeClassID').val());
                } else {
                    $('#makeClassID').focus();
                }
            }
        });
        $('#makeClassDo').click(function() {
            if($('#makeClassID').val().split(" ").join("") != "") {
                doNewClass($('#makeClassID').val());
            } else {
                $('#makeClassID').focus();
            }
        });
        loadDashData = function() {
            $('.dashRendered').remove();
            var userID = fb.getAuth().uid;
            var userPath = fb.child("users/" + userID);
            var classes = userPath.child("class");
            classes.once("value", function(classesSnap) {
                if(classesSnap.val()) {
                    for(var c in classesSnap.val()) {
                        $('<div class="col-md-4 dashRendered"><div class="panel panel-default"><div class="panel-body"><a href="/manage/' + c + '"><h2>' + c + '</h2></a></div></div></div>').css({
                            scale: 0
                        }).appendTo("#cardboard").transition({
                            scale: 1
                        });
                    }
                } else {
                    $('<div class="col-md-4 dashRendered"><div class="panel panel-default"><div class="panel-body"><h2>You don&apos;t have any classes.</h2></div></div></div>').css({
                        scale: 0
                    }).appendTo("#cardboard").transition({
                        scale: 1
                    });
                }
            });
        };
        doColours = function(tID) {
            localStorage.setItem("teacher", tID);
            fb.child("teachers/" + tID + "/colours").once("value", function(snap) {
                if(snap.val() != null) {
                    $('nav').animate({
                        backgroundColor: snap.val().navbar
                    });
                    $('body').animate({
                        backgroundColor: snap.val().bg
                    });
                }
            });
        };
        var quizDone;
        startQuiz = function(qID) {
            $('#qInf').hide();
            var teacher = fb.child("teachers/" + qID);
            teacher.child("pub").once("value", function(teacherExistsSnap) {
                if(teacherExistsSnap.val()) {
                    teacher.child("currentQuiz").once("value", function(currentQuizSnap) {
                        var quizID = currentQuizSnap.val();
                        if(quizID != null) {
                            var quiz = teacher.child("quiz/" + quizID);
                            quiz.child("name").once("value", function(qNSnap) {
                                $('.quizName').text(qNSnap.val());
                            });
                            quiz.child("firstQuestion").once("value", function(fQSnap) {
                                var fQID = fQSnap.val();
                                var questions = quiz.child("question");
                                window.getQ = function(id) {
                                    $('#radioButtons').slideUp(function() {});
                                    $('#answer').slideDown();
                                    questions.child(id + "/content").once("value", function(QSnap) {
                                        $('#quizCard').transition({
                                            scale: 1
                                        });
                                        var Q = QSnap.val();
                                        if(Q.settings) {
                                            if(Q.settings.multChoice) {
                                                $('#answer').slideUp();
                                                $('#radioButtons').html("");
                                                var multChoices = [];
                                                for(var choice in Q.settings.multChoices) {
                                                    multChoices.push([choice, Q.settings.multChoices[choice]]);
                                                }
                                                multChoices.sort(function(a, b) {
                                                    return a[0].localeCompare(b[0]);
                                                });
                                                for(var choice in multChoices) {
                                                    $('#radioButtons').append("<div class='radio'><label><input type='radio' name='multChoiceRadio' class='multChoiceRadio' onchange='injAns(this.value)' value='" + multChoices[choice][0] + "'><b>" + multChoices[choice][0] + "</b>&nbsp;" + multChoices[choice][1] + "</label></div>")
                                                }
                                                $('#radioButtons').slideDown();
                                            }
                                        }
                                        $('#questionNumber').text('#' + Q.num);
                                        $('#questionContent').html(Q.query);
                                        $('#answer').val('');
                                        $('#answerDo').attr('onclick', 'answerQ("' + id + '", ' + JSON.stringify(Q) + ')');
                                    });
                                };
                                window.injAns = function(text) {
                                    $('#answer').val(text);
                                };
                                window.answerQ = function(queID, inf) {
                                    var answer = $('#answer').val();
                                    questions.child(queID + "/answer/" + fb.getAuth().uid).set({
                                        a: answer,
                                        g: false
                                    }, function(err) {
                                        if(err) { //To err is human.
                                            $.snackbar({
                                                content: err
                                            });
                                        } else {
                                            if(inf.settings.checkAnswers) {
                                                if(inf.settings.correctAnswer) {
                                                    var correctAnswerPath = questions.child(queID + "/correctAnswer");
                                                    correctAnswerPath.once("value", function(correctAnswerSnap) {
                                                        if(answer.split(" ").join("").toLowerCase() == correctAnswerSnap.val().split(" ").join("").toLocaleLowerCase()) {
                                                            questions.child(queID + "/answer/g").set(true);
                                                            $.snackbar({
                                                                content: "CORRECT!"
                                                            });
                                                        } else {
                                                            questions.child(queID + "/answer/g").set(false);
                                                            $.snackbar({
                                                                content: "NOPE!"
                                                            });
                                                        }
                                                    });
                                                } else if(inf.settings.keyTerm) {
                                                    var keyTermsPath = questions.child(queID + "/keyTerms");
                                                    keyTermsPath.once("value", function(keyTermsSnap) {
                                                        var answerSpaceless = answer.split(" ").join("").toLowerCase();;
                                                        var fitsTerm = false;
                                                        for(var t in keyTermsSnap.val()) {
                                                            if(answerSpaceless.split(keyTermsSnap.val()[t].toLowerCase()).length > 1) {
                                                                fitsTerm = true;
                                                                break;
                                                            }
                                                        }
                                                        questions.child(queID + "/answer/g").set(fitsTerm);
                                                        $.snackbar({
                                                            content: (fitsTerm ? "CORRECT!" : "NOPE!")
                                                        });
                                                    });
                                                }
                                            }
                                        }
                                        questions.child(queID + "/next").once("value", function(nextSnap) {
                                            if(nextSnap.val()) {
                                                quiz.child("progress/" + fb.getAuth().uid).set(nextSnap.val());
                                                $('#qInf').slideUp();
                                                getQ(nextSnap.val());
                                            } else {
                                                quiz.child("progress/" + fb.getAuth().uid).set("_finish");
                                                quizDone();
                                            }
                                        });
                                    });
                                };
                                quiz.child("progress/" + fb.getAuth().uid).once("value", function(prog) {
                                    if(prog.val() != null) {
                                        if(prog.val() == "_finish") {
                                            quizDone(true);
                                        } else {
                                            getQ(prog.val());
                                        }
                                    } else {
                                        getQ(fQID);
                                    }
                                });
                            });
                        } else {
                            router.setRoute("/dash");
                            $.snackbar({
                                content: "That class has no open quiz."
                            });
                        }
                    })
                } else {
                    router.setRoute("/dash");
                    $.snackbar({
                        content: "That class doesn't exist."
                    });
                }
            });
        };
        quizDone = function(isDone) {
            $('.quizName').text("Loading...");
            $('#quizCard').transition({
                scale: 0
            }, 300, "snap", function() {
                router.setRoute("/dash");
            });
            if(!isDone) {
                $.snackbar({
                    content: "Done! Answers have been sent to your teacher."
                });
            } else {
                $.snackbar({
                    content: "You already took that quiz."
                });
            }
        };
        router.init(hash.split("#")[1] || path);
        $('body').removeAttr("unresolved");
    };
    app(location.pathname);
})();