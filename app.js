var photosGallery = angular.module('photosGallery', ['ui.router', 'ngAnimate'])
    .config(function ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider) {
        //URL case insensitive
        $urlMatcherFactoryProvider.caseInsensitive(true);

        //remove the "#" from URL
        $locationProvider.html5Mode(true);

        $urlRouterProvider.otherwise("/home");


        $stateProvider
            .state('content', {
                url: "/",
                abstract: true,
                data: {
                    user: "user",
                    password: "1234"
                },
                views: {
                    "": {
                        templateUrl: 'partials/content.html',
                        controller: 'RootController'
                            //content.html: ui-view="header"; ui-view="body"
                    },
                    //表示对应的是content.html里面的<div ui-view="header">
                    "header@content": {
                        templateUrl: 'partials/header.html',
                        controller: function ($scope, $rootScope, $state) {
                            $scope.reading = false;
                            $scope.logoff = function () {
                                $scope.reading = true;
                                setTimeout(function () {
                                    $scope.$apply(function () {
                                        $rootScope.user = null;
                                        $scope.reading = false;
                                    })
                                }, 800);

                            }
                        }
                    }
                }
            })
            .state('content.login', {
                url: 'login',
                data: {
                    loginError: 'Username or password incorrect.'
                },
                views: {
                    "body@content": {
                        templateUrl: 'partials/login.html',
                        controller: function ($scope, $rootScope, $state) {
                            $scope.login = function (user, password, valid) {
                                if (!valid) {
                                    return;
                                }

                                if ($state.current.data.user === user && $state.current.data.password === password) {
                                    $rootScope.user = {
                                        name: $state.current.data.user
                                    };
                                    $state.go('content.home');
                                } else {
                                    $scope.message = $state.current.data.loginError;
                                }

                            }
                        }
                    }
                }
            })
            .state('content.home', {
                url: "home",
                views: {
                    //content.html中对应的<div ui-view="body">
                    "body@content": {
                        templateUrl: 'partials/home.html',
                        controller: 'HomeController',
                        controllerAs: 'ctrHome'
                    }
                }
            })
            .state('content.photos', {
                url: "photos",
                abstract: true,
                views: {
                    "body@content": {
                        templateUrl: 'partials/photos.html',
                        controller: 'PhotoController',
                        controllerAs: 'ctrPhoto'
                    }
                }
            })
            .state('content.photos.list', {
                url: '/list',
                templateUrl: 'partials/photos-list.html',
                controller: 'PhotoListController',
                controllerAs: 'ctrPhotoList'
            })
            .state('content.photos.detail', {
                url: '/detail/:id',
                templateUrl: 'partials/photos-detail.html',
                controller: 'PhotoDetailController',
                controllerAs: 'ctrPhotoDetail',
                data: {
                    required: true
                },
                resolve: {
                    viewing: function ($stateParams) {
                        return {
                            photoId: $stateParams.id
                        }
                    }
                },
                onEnter: function (viewing) {
                    //从sessionStorage里面取值
                    var photo = JSON.parse(sessionStorage.getItem(viewing.photoId));
                    if (!photo) {
                        photo = {
                            views: 1,
                            viewing: 1
                        }
                    } else {
                        photo.views = photo.views + 1;
                        photo.viewing = photo.viewing + 1;
                    }
                    //把值存入到sessionStorage: key-value 键值对
                    sessionStorage.setItem(viewing.photoId, JSON.stringify(photo));

                },
                onExit: function (viewing) {
                    var photo = JSON.parse(sessionStorage.getItem(viewing.photoId));

                    photo.viewing = photo.viewing - 1;
                    //
                    sessionStorage.setItem(viewing.photoId, JSON.stringify(photo));
                }
            })
            .state('content.photos.detail.comment', {
                url: '/comment?skip&limit',
                templateUrl: 'partials/photos-detail-comment.html',
                controller: 'PhotoCommentController',
                controllerAs: 'ctrPhotoComment',
                data: {
                    required: true
                },
            })
            .state("content.about", {
                url: "about",
                views: {
                    "body@content": {
                        templateUrl: 'partials/about.html'
                    }
                }
            })
            .state("content.notfound", {
                url: "notfound",
                views: {
                    "body@content": {
                        templateUrl: 'partials/page-not-found.html'
                    }
                }
            })
            //create a new state to show the log informations
            .state("content.log", {
                url: 'log',
                data: {
                    required: true
                },
                views: {
                    "body@content": {
                        templateUrl: 'partials/log.html'
                    }
                }
            })
            //simulating error for $stateChangeError event
            .state("content.profile", {
                url: 'profile',
                data: {
                    required: true
                },
                resolve: {
                    showError: function () {
                        throw 'Error in code...';
                    }
                },
                views: {
                    "body@content": {
                        template: '<div>Error</div>'
                    }
                }
            })
            .state("content.error", {
                url: "error/:error",
                views: {
                    "body@content": {
                        templateUrl: "partials/error.html",
                        controller: function ($scope, $stateParams) {
                            $scope.error = {
                                message: $stateParams.error
                            }
                        }
                    }
                }
            });

    })
    .controller('RootController', ['$scope', '$state', '$rootScope', function ($scope, $state, $rootScope) {
        //进行登录验证(login Auth)
        //每一次state change都会调用这个方法，我们只要在需要apply这个功能的地方添加上data: {required:true} 就可以了。
        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            if (toState.data.required && !$rootScope.user) {
                event.preventDefault();
                $state.go('content.login');
            }
        });

        //$stateNotFound：如果没有找到相关的state，就调用我们指定的state
        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            event.preventDefault();
            $state.go('content.notfound');
        });

        //$stateChangeSuccess: access the login information
        $rootScope.accessLog = new Array();
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            $rootScope.accessLog.push({
                user: $rootScope.user,
                from: fromState.name,
                to: toState.name,
                date: new Date()
            });
        });

        //$stateChangeError: 如果state跳转时发生错误，就跳转到指定的错误页面
        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            event.preventDefault();
            $state.go('content.error', {
                error: error
            });
        });

    }])
    .controller('HomeController', ['$scope', '$state', function ($scope, $state) {
        this.message = "Welcome to my Photo Gallery!";
    }])
    .controller('PhotoController', ['$scope', '$state', function ($scope, $state) {
        this.photos = [
            {
                id: 0,
                title: 'Photo 1',
                description: 'description for photo 1',
                imageName: 'image1.JPG',
                comments: [
                    {
                        name: 'user1',
                        comment: 'Nice',
                        imageName: 'user.png'
                        },
                    {
                        name: 'user2',
                        comment: 'Very good',
                        imageName: 'user.png'
                        }
                ]
            },
            {
                id: 1,
                title: 'Photo 2',
                description: 'description for photo 1',
                imageName: 'image2.JPG',
                comments: [
                    {
                        name: 'user1',
                        comment: 'Nice',
                        imageName: 'user.png'
                        },
                    {
                        name: 'user2',
                        comment: 'Very good',
                        imageName: 'user.png'
                        }
                ]
            },
            {
                id: 2,
                title: 'Photo 3',
                description: 'description for photo 2',
                imageName: 'image3.JPG',
                comments: [
                    {
                        name: 'user1',
                        comment: 'Nice',
                        imageName: 'user.png'
                        },
                    {
                        name: 'user2',
                        comment: 'Very good',
                        imageName: 'user.png'
                        },
                    {
                        name: 'user3',
                        comment: 'Beautiful',
                        imageName: 'user.png'
                        }
                ]
                },
            {
                id: 3,
                title: 'Photo 3',
                description: 'description for photo 1',
                imageName: 'image4.JPG',
                comments: [
                    {
                        name: 'user1',
                        comment: 'Nice',
                        imageName: 'user.png'
                        }
                ]
            }
        ];
    }])
    .controller('PhotoListController', ['$scope', '$state', function ($scope, $state) {

        this.reading = false;
        this.photos = new Array();

        //调用init方法，设置loading时间
        this.init = function () {
            this.reading = true;
            setTimeout(function () {
                $scope.$apply(function () {
                    $scope.ctrPhotoList.getData();
                })
            }, 1500);
        }

        this.getData = function () {
            this.photos = $scope.$parent.ctrPhoto.photos;
            this.reading = false;
        }
    }])
    .controller('PhotoDetailController', ['$scope', '$state', '$stateParams', function ($scope, $state, $stateParams) {
        var id = null;
        this.photo = null;
        this.init = function () {
            id = parseInt($stateParams.id);
            this.photo = $scope.$parent.ctrPhoto.photos[id];
            this.viewObj = JSON.parse(sessionStorage.getItem($stateParams.id));
        }
    }])
    .controller('PhotoCommentController', ['$scope', '$state', '$stateParams', function ($scope, $state, $stateParams) {
        var id, skip, limit = null;
        this.comments = new Array();

        this.init = function () {
            //$stateParams.id comes from parent state
            id = parseInt($stateParams.id);
            var photo = $scope.ctrPhoto.photos[id];

            if ($stateParams.skip) {
                skip = parseInt($stateParams.skip);
            } else {
                skip = 0;
            }

            if ($stateParams.limit) {
                limit = parseInt($stateParams.limit);
            } else {
                limit = photo.comments.length;
            }

            this.comments = photo.comments.slice(skip, limit);
        }
    }]);