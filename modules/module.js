define([
    'require',
    'module',

    '{lodash}/lodash',
    '{angular}/angular',

    '[text]!{w20-material-theme}/templates/topbar.html',
    '[text]!{w20-material-theme}/templates/sidenav.html',

    '{w20-material-theme}/modules/material-theme',
    '{w20-material-theme}/modules/route-service',

    '{w20-core}/modules/culture',
    '{w20-core}/modules/utils',

], function(require, module, _, angular, topbarTemplate, sidenavTemplate, w20materialThemeModule) {
    'use strict';

    var w20MaterialTheme = w20materialThemeModule.module,
        _config = module && module.config() || {};

    w20MaterialTheme.directive('w20MaterialTopbar', ['$rootScope', '$route', 'CultureService', '$timeout', '$window', '$document', '$mdUtil', '$animate', '$filter', '$log',
        function($rootScope, $route, cultureService, $timeout, $window, $document, $mdUtil, $animate, $filter, $log) {
            return {
                template: topbarTemplate,
                restrict: 'E',
                scope: {
                    searchMaxlength: "=",
                    searchPlaceholder: "=",
                    searchDisabled: "<?"
                },
                link: link
            };

            function link(scope, iElement, iAttrs) {

                scope.topbar = {
                    title: ""
                };

                scope.displayName = cultureService.displayName;

                scope.openSidenav = function() {
                    scope.$emit("w20.material.sidenav.open", true);
                };
                
                scope.search = {
                    opened: false,
                    value: "",
                    disabled: false,
                    _placeholder: "",
                    get placeholder() {
                        return scope.search._placeholder;
                    },
                    set placeholder(val) {
                        scope.search._placeholder = cultureService.localize(val, [], val);
                    },
                    unwatch: undefined,
                    open: function() {
                        scope.search.opened = true;
                        scope.search.focus();

                        scope.search.unwatch = scope.$watch(function(scope) {
                            return scope.search.value;
                        }, scope.search._broadcast);
                    },
                    close: function() {
                        scope.search.opened = false;
                        scope.search.unwatch();
                        scope.search.value = "";
                        scope.search._broadcast("");
                    },
                    focus: function() {
                        $timeout(function() {
                            $window.document.querySelector("md-toolbar [name=w20-material-theme-search]").focus();
                        });
                    },
                    _broadcast: function (value) {
                        $rootScope.$broadcast("w20.material.topbar.search.query", value);
                    }
                };

                scope.$watch(function() {
                    return scope.searchDisabled;
                }, function(newV, oldV) {
                    if(newV !== oldV) 
                        scope.search.disabled = newV == "true" || newV == ""? true: false;
                    scope.search.opened = scope.search.disabled ? false: scope.search.opened;
                });

                scope.$watch(function() {
                    return scope.searchPlaceholder;
                }, function(newV, oldV) {
                    if(newV !== oldV)
                        scope.search.placeholder = newV;
                });
                scope.search.placeholder = scope.searchPlaceholder;

                scope.unregister = {
                    "$routeChangeSuccess" : $rootScope.$on('$routeChangeSuccess', function(event, route) {
                        if(route && route.$$route)
                            scope.topbar.title = cultureService.localize(route.$$route.i18n + ".title");
                        scope.search.value = "";
                    })
                }

                scope.$on('$destroy', function(event) {
                    scope.unregister.forEach(function(fn) {fn()});
                });
            }
        }
    ]);

    w20MaterialTheme.directive('w20MaterialSidenav', ['$rootScope', 'CultureService', 'AuthenticationService', 'RouteService', '$mdSidenav', '$location',
        function($rootScope, cultureService, authenticationService, routeService, $mdSidenav, $location) {

            return {
                template: sidenavTemplate,
                restrict: 'E',
                scope: true,
                link: link
            };

            function link(scope, iElement, iAttrs) {
                scope.sidenav = {
                    logoUrl: _config.logoUrl || "/home",
                    logoImg: _config.logoImg,
                    backgroundImg: _config.backgroundImg,
                    user: "",
                    routes: routeService.topLevelRoutes(),
                    name: "w20.material.sidenav"
                };
                
                scope.displayName = cultureService.displayName;
                
                scope.go = function(path, $event) {
                    $location.path(path);
                    $mdSidenav("w20.material.sidenav").close();
                };

                scope.unregister = {
                    "w20.security.authenticated": $rootScope.$on('w20.security.authenticated',function(){
                        scope.userFullName = authenticationService.subjectPrincipals().fullName;
                    }),
                    "w20.material.sidenav.open": $rootScope.$on(scope.sidenav.name +".open", function(event, val) {
                        val = !angular.isDefined(val) ? 'toggle': val ? 'open': 'close';
                        $mdSidenav("w20.material.sidenav")[val]();
                    })
                }
                
                scope.$on('$destroy', function(event) {
                    scope.unregister.forEach(function(fn) {fn()});
                });
            };
        }
    ]);

    return {
        lifecycle: {}
    };
});
