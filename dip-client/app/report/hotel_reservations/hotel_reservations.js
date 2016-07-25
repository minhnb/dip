'use strict';

angular.module('dipApp.report_hotel_reservations', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/report/hotel-reservations', {
            templateUrl: 'report/hotel_reservations/hotel_reservations.html',
            controller: 'ReportHotelReservationsController'
        });
    }])

    .controller('ReportHotelReservationsController', ['$scope', '$timeout', '$rootScope', '$location', '$compile', 'reportService',
        function ($scope, $timeout, $rootScope, $location, $compile, reportService) {
            $rootScope.isNoMenuPage = false;
            $rootScope.pageTitle = "Hotel Reservations Report";
            $scope.tableTitle = "List Hotel Reservations";
            $scope.headers = ["Username", "Name", "Hotel", "PassDate", "Passes", "Before Tax", "Tax", "Total", "Purchased Date"];
            $scope.columns = ["user.username", "user.fullName", "hotel.name", "passDate", "passes", "beforeTax", "tax", "price", "purchasedDate"];
            $scope.rows = [];

            $scope.getHotelReservationsReport = function () {
                reportService.getHotelReservationsReport()
                    .success(function (data, status) {
                        $scope.rows = $scope.analyzeHotelReservationsReportData(data);
                        $scope.bindingDatatable();
                    })
                    .error(function (data, status) {

                    });
            };

            $scope.analyzeHotelReservationsReportData = function (list) {
                list.map(item => {
                    item.price = displayMoney(item.price);
                    item.tax = displayMoney(item.tax);
                    item.beforeTax = displayMoney(item.beforeTax);
                    item.purchasedDate = formatTimeStampToDateTime(item.createdAt);
                    let passes = "";
                    let passDate = "";
                    let passesArray = [];
                    item.services.map(service => {
                        service.offers.map(offer => {
                            if (!passDate) {
                                passDate = formatDipDateToDate(offer.date);
                            }
                            let passPrice = displayMoney(offer.price);
                            let passDescription = '<div>' + offer.description + " " + passPrice + " x " + offer.count + '</div>';
                            if (passes.length > 0) {
                                passes += "<br/>" + passDescription;
                            } else {
                                passes += passDescription;
                            }
                            offer.price = displayMoney(offer.price);
                            passesArray.push(offer);
                        });
                    });
                    item.passes = passesArray;
                    item.passDate = passDate;
                });
                return list;
            };

            setTimeout(function () {
                $scope.getHotelReservationsReport();
            }, 100);
        }]);