$(document).ready(function () {

    $(".patient-records").sortable({
        handle: ".panel-heading",
        items: "div.panel",
        tolerance: "pointer"
    });

    $('.patient-records .panel-heading span.remove').on('click', function () {

        var target = $(this).closest('.panel');

        target.fadeOut(300, function () {
            $(this).remove();
        });

    });

    $(window).scroll(function () {
        if ($(this).scrollTop() < 200) {
            $('#smoothscroll').fadeOut();
        } else {
            $('#smoothscroll').fadeIn();
        }
    });

    $('#smoothscroll').on('click', function () {
        $('html, body').animate({scrollTop: 0}, 'fast');
        return false;
    });

    $('#timeline-example').ehrscapeTimeline();

    // ehrscape API - handi domain and Mary Wlikinson in handi domain = subjectid 740
    var baseUrl = "https://rest.ehrscape.com/rest/v1";
//    var ehrId = "168f8b85-f70c-4342-ab42-51856cf1be14";
//    var ehrId = "879be82a-0a15-44fd-95c3-cef42f9560c3";
    var ehrId = "a3f30697-1223-473e-bd4b-0f72e64d7a24";

    var username = 'handi';
    var password = 'RPEcC859';

    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var sessionId;

    function login() {
        return $.ajax({
            type: "POST",
            url: baseUrl + "/session?" + $.param({username: username, password: password}),
            success: function (res) {
                sessionId = res.sessionId;
            }
        });
    }

    function logout() {
        return $.ajax({
            type: "DELETE",
            url: baseUrl + "/session",
            headers: {
                "Ehr-Session": sessionId
            }
        });
    }

    function patientData() {
        return $.ajax({
            url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (data) {
                var party = data.party;

                // Name
                $("#patient-name").html(party.firstNames + ' ' + party.lastNames);

                // Complete age
                var age = getAge(formatDateUS(party.dateOfBirth));
                $(".patient-age").html(age);

                // Date of birth
                var date = new Date(party.dateOfBirth);
                var stringDate = monthNames[date.getMonth()] + '. ' + date.getDate() + ', ' + date.getFullYear();
                $(".patient-dob").html(stringDate);

                // Age in years
                $(".patient-age-years").html(getAgeInYears(party.dateOfBirth));

                // Gender
                var gender = party.gender;
                $("#patient-gender").html(gender.substring(0, 1) + gender.substring(1).toLowerCase());

                // Patient's picture
                var imageUrl;
                if (party.hasOwnProperty('partyAdditionalInfo')) {
                    party.partyAdditionalInfo.forEach(function (el) {
                        if (el.key === 'image_url') {
                            imageUrl = el.value;
                        }
                    });
                }
                if (imageUrl !== undefined) {
                    $('.patient-pic').css('background', 'url(' + imageUrl + ')');
                } else {
                    $('.patient-pic').css('background', 'url(./img/conchita.jpg) center no-repeat');
                }
            }
        });
    }

    function bloodPressures() {
        var colors = ['#ED5565', '#DA4453'];
        return $.ajax({
            url: baseUrl + "/view/" + ehrId + "/blood_pressure",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                //console.log('2');
                res.forEach(function (el, i, arr) {
                    var date = new Date(el.time);
                    el.date = date.getTime();
                });

                new Morris.Area({
                    element: 'blood-pressures',
                    data: res.reverse(),
                    xkey: 'date',
                    ykeys: ['systolic', 'diastolic'],
                    lineColors: colors,
                    labels: ['Systolic', 'Diastolic'],
                    lineWidth: 2,
                    pointSize: 3,
                    hideHover: true,
                    behaveLikeLine: true,
                    smooth: false,
                    resize: true,
                    xLabels: "day",
                    xLabelFormat: function (x) {

                        var date = new Date(x);

                        return (date.getDate() + '-' + monthNames[date.getMonth()]);
                    },
                    dateFormat: function (x) {

                        return (formatDate(x, false));
                    }
                });

                //last measurement
                var bp = res[res.length - 1].systolic + "/" + res[res.length - 1].diastolic + " " + res[res.length - 1].unit;
                $('.last-bp').text(bp);
                $('.last-bp-date').text(formatDate(res[res.length - 1].time, true));
            }
        });
    }

    function getWeight() {
        return $.ajax({
            url: baseUrl + "/view/" + ehrId + "/weight",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                // display newest
                $('.weight-placeholder-value').text(res[0].weight);
                $('.weight-placeholder-unit').text(res[0].unit);

                var cw = res[0].weight + " " + res[0].unit;
                $('.last-cw').text(cw);
                $('.last-cw-date').text(formatDate(res[0].time, true));

                res.forEach(function (el, i, arr) {
                    var date = new Date(el.time);
                    el.date = date.getTime();
                });

                new Morris.Area({
                    element: 'chart-weight',
                    data: res.reverse(),
                    xkey: 'date',
                    ykeys: ['weight'],
                    lineColors: ['#4FC1E9', '#3BAFDA'],
                    labels: ['Weight'],
                    lineWidth: 2,
                    pointSize: 3,
                    hideHover: true,
                    behaveLikeLine: true,
                    smooth: false,
                    resize: true,
                    xLabels: "day",
                    xLabelFormat: function (x) {
                        var date = new Date(x);
                        return (date.getDate() + '-' + monthNames[date.getMonth()]);
                    },
                    dateFormat: function (x) {
                        return (formatDate(x, false));
                    }
                });
            }
        });
    }

    function getHeight() {
        return $.ajax({
            url: baseUrl + "/view/" + ehrId + "/height",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                // display newest
                $('.height-placeholder-value').text(res[0].height);
                $('.height-placeholder-unit').text(res[0].unit);

                var gender = $('#patient-gender').text().toLowerCase();

                if (gender) {
                    var picture = $('.patient-height-image');
                    var src = "img/body-blank-" + gender + ".png";
                    picture.attr("src", src);
                }

                var ch = res[0].height + " " + res[0].unit;
                $('.last-ch').text(ch);
                $('.last-ch-date').text(formatDate(res[0].time, true));

                res.forEach(function (el, i, arr) {
                    var date = new Date(el.time);
                    el.date = date.getDate() + '-' + monthNames[date.getMonth()];
                });

                new Morris.Bar({
                    element: 'chart-height',
                    data: res.reverse(),
                    xkey: 'date',
                    ykeys: ['height'],
                    labels: ['Height'],
                    hideHover: true,
                    barColors: ['#48CFAD', '#37BC9B'],
                    xLabelMargin: 5,
                    resize: true
                });
            }
        });
    }

    function getSpo2() {
        return $.ajax({
            url: baseUrl + "/view/" + ehrId + "/spO2",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                var value = res[0].spO2.toFixed(2);
                $('.last-spo2').text(value + "%");
                $('.bar-spo2').css('width', value + "%");
            }
        });
    }

    function getTemperature() {
        return $.ajax({
            url: baseUrl + "/view/" + ehrId + "/body_temperature",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                //display newest
                var bt = res[0].temperature + " " + res[0].unit;
                $('.last-bt').text(bt);
                $('.last-bt-date').text(formatDate(res[0].time, true));

                res.forEach(function (el, i, arr) {
                    var date = new Date(el.time);
                    el.date = date.getDate() + '-' + monthNames[date.getMonth()];
                });

                new Morris.Bar({
                    element: 'body-temperature',
                    data: res.reverse(),
                    xkey: 'date',
                    ykeys: ['temperature'],
                    labels: ['Body Temperature'],
                    hideHover: true,
                    barColors: ['#FFCE54', '#F6BB42'],
                    xLabelMargin: 5,
                    resize: true
                });
            }
        });
    }

    function getPulse() {
        return $.ajax({
            url: baseUrl + "/view/" + ehrId + "/pulse",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                res.forEach(function (el, i, arr) {
                    var date = new Date(el.time);
                    el.date = date.getTime();
                });

                new Morris.Area({
                    element: 'pulse',
                    data: res.reverse(),
                    xkey: 'date',
                    ykeys: ['pulse'],
                    lineColors: ['#A0D468', '#8CC152'],
                    labels: ['Pulse'],
                    lineWidth: 2,
                    pointSize: 3,
                    hideHover: true,
                    behaveLikeLine: true,
                    smooth: false,
                    resize: true,
                    xLabels: "day",
                    xLabelFormat: function (x) {
                        var date = new Date(x);
                        return (date.getDate() + '-' + monthNames[date.getMonth()]);
                    },
                    dateFormat: function (x) {
                        return (formatDate(x, false));
                    }
                });

                //last measurement
                var p = res[res.length - 1].pulse + " " + res[res.length - 1].unit;
                $('.last-pulse').text(p);
                $('.last-pulse-date').text(formatDate(res[res.length - 1].time, true));
            }
        });
    }

    function getAllergies() {
        return $.ajax({
            url: baseUrl + "/view/" + ehrId + "/allergy",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                for (var i = 0; i < res.length; i++) {
                    $('ul.allergies').append('<li>' + res[i].agent + '</li>');
                }
            }
        });
    }

    function getUKAllergies() {
        return $.ajax({
            url: baseUrl + "/query/?aql=select%20a_a%2Fdata%5Bat0001%5D%2Fitems%5Bat0025%5D%2Fitems%5Bat0021%5D%2Fvalue%20as%20Date_recorded%2C%20a_a%2Fdata%5Bat0001%5D%2Fitems%5Bat0002%5D%2Fvalue%20as%20Causative_agent%20from%20EHR%20e%5Behr_id%2Fvalue%3D'a3f30697-1223-473e-bd4b-0f72e64d7a24'%5D%20contains%20COMPOSITION%20a%20contains%20EVALUATION%20a_a%5BopenEHR-EHR-EVALUATION.adverse_reaction_uk.v1%5D%20offset%200%20limit%20100",
           type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                for (var i = 0; i < res.resultSet.length; i++) {
                    $('ul.allergies').append('<li>'  + formatDate(res.resultSet[i].Date_recorded.value,false) + ' - ' + res.resultSet[i].Causative_agent.value + '</li>');
                }
            },
            error: function(){alert('fail');}

        });
    }

    function getUKMedications() {
        return $.ajax({
            //url: baseUrl + "/query/?aql=select%20a_a%2Fdata%5Bat0001%5D%2Fitems%5Bat0025%5D%2Fitems%5Bat0021%5D%2Fvalue%20as%20Date_recorded%2C%20a_a%2Fdata%5Bat0001%5D%2Fitems%5Bat0002%5D%2Fvalue%20as%20Causative_agent%20from%20EHR%20e%5Behr_id%2Fvalue%3D'a3f30697-1223-473e-bd4b-0f72e64d7a24'%5D%20contains%20COMPOSITION%20a%20contains%20EVALUATION%20a_a%5BopenEHR-EHR-EVALUATION.adverse_reaction_uk.v1%5D%20offset%200%20limit%20100",
            url: baseUrl + "/query/?aql="+ encodeURIComponent("select a_b/items[at0001]/value/value as value, a_b/items[at0019]/items[at0003]/value/value as dose         from EHR e[ehr_id/value='a3f30697-1223-473e-bd4b-0f72e64d7a24']         contains COMPOSITION a         contains (             INSTRUCTION a_a[openEHR-EHR-INSTRUCTION.medication_order_uk.v1]         contains CLUSTER a_b[openEHR-EHR-CLUSTER.medication_item.v1]         and         CLUSTER m_s[openEHR-EHR-CLUSTER.medication_status.v1])         where m_s/items[at0030]/value/defining_code/code_string='at0033'         offset 0 limit 20"),
            //           url: baseUrl + "/query/?aql="+ encodeURIComponent("SELECT c FROM EHR[ehr_id/value='" + ehrId + "'] CONTAINS COMPOSITION c ORDER BY c/context/start_time DESC FETCH 20"),
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                for (var i = 0; i < res.resultSet.length; i++) {
                    $('ul.medications').append('<li>' + " " + res.resultSet[i].value + '<br/>' + res.resultSet[i].dose + ' </li>');
                }
            },
            error: function(){alert('fail');}

        });
    }

    function getUKProblems() {
        return $.ajax({
            //url: baseUrl + "/query/?aql=select%20a_a%2Fdata%5Bat0001%5D%2Fitems%5Bat0025%5D%2Fitems%5Bat0021%5D%2Fvalue%20as%20Date_recorded%2C%20a_a%2Fdata%5Bat0001%5D%2Fitems%5Bat0002%5D%2Fvalue%20as%20Causative_agent%20from%20EHR%20e%5Behr_id%2Fvalue%3D'a3f30697-1223-473e-bd4b-0f72e64d7a24'%5D%20contains%20COMPOSITION%20a%20contains%20EVALUATION%20a_a%5BopenEHR-EHR-EVALUATION.adverse_reaction_uk.v1%5D%20offset%200%20limit%20100",
            url: baseUrl + "/query/?aql="+ encodeURIComponent("select     a_a/data[at0001]/items[at0002]/value/value as value,     a_a as Problem_Diagnosis3,     a_a/data[at0001]/items[at0003]/value as Date_of_Onset from EHR e[ehr_id/value='a3f30697-1223-473e-bd4b-0f72e64d7a24'] contains COMPOSITION a contains EVALUATION a_a[openEHR-EHR-EVALUATION.problem_diagnosis.v1] offset 0 limit 20"),
            //           url: baseUrl + "/query/?aql="+ encodeURIComponent("SELECT c FROM EHR[ehr_id/value='" + ehrId + "'] CONTAINS COMPOSITION c ORDER BY c/context/start_time DESC FETCH 20"),
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                for (var i = 0; i < res.resultSet.length; i++) {
                    $('ul.problems').append('<li>' + formatDate(res.resultSet[i].Date_of_Onset.value,false) + " " + res.resultSet[i].value + ' </li>');
                }
            },
            error: function(){alert('fail');}

        });
    }

    function getMedications() {
        return $.ajax({
            url: baseUrl + "/view/" + ehrId + "/medication",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                for (var i = 0; i < res.length; i++) {
                    $('ul.medications').append('<li>' + res[i].medicine + ' - ' + res[i].quantity_amount + res[i].quantity_unit + '</li>');
                }
            }
        });
    }

    function getProblems() {
        return $.ajax({
            url: baseUrl + "/view/" + ehrId + "/problem",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (res) {
                for (var i = 0; i < res.length; i++) {
                    $('ul.problems').append('<li>' + res[i].onset_date + " " + res[i].diagnosis + "<br/>| RV2 | " + res[i].diagnosis_code + ' |</li>');
                }
            }
        });
    }

    function getBMI(){

        return $.ajax({
            url: "https://rest.ehrscape.com/ThinkCDS/services/CDSResources/guide/execute/BMI.Calculation.v.1/" + ehrId,
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (data) {
                var bmiVal = '', bmiDet = '';
                if (data instanceof Array) {
                    if (data[0].hasOwnProperty('results')) {
                        data[0].results.forEach(function (v, k) {
                            if (v.archetypeId === 'openEHR-EHR-OBSERVATION.body_mass_index.v1') {
                                var rounded = Math.round(v.value.magnitude * 100.0) / 100.0;
                                bmiVal = rounded + ' ' + v.value.units;
                            }
                            else{
                                if(v.archetypeId === 'openEHR-EHR-EVALUATION.gdl_result_details.v1'){
                                    bmiDet = '<span class="bmi-details">' + v.value.value + '</span>';
                                }
                            }
                        })
                    }
                }
                $('.patient-bmi').html(bmiVal + bmiDet);
            }
        });
    }

    function getLabs() {
        return $.ajax({
            url: baseUrl + "/view/" + ehrId + "/labs",
            type: 'GET',
            headers: {
                "Ehr-Session": sessionId
            },
            success: function (data) {

                var html = "";

                for (var i=0; i<data.length; i++){
                    html += '<tr>';

                    html += '<td>' + data[i].name + '</td>'+
                        '<td>' + data[i].loinc + '</td>'+
                        '<td>' + normalRange(data[i]) + '</td>'+
                        '<td>' + checkValue(data[i]) + '</td>'+
                        '<td>' + data[i].unit + '</td>'+
                        '<td>' + formatDate(data[i].time, true) + '</td>';

                    html += '</tr>';
                }

                $("#labResults").find("tbody").append(html);

            }
        });
    }

    function normalRange(item){

        var range = "";
        if(item.normal_max && item.normal_min){
            range = item.normal_min + " - " + item.normal_max;
        }
        else{
            if(item.normal_max){
                range = "< " + item.normal_max;
            }
            else{
                if(item.normal_min){
                    range = "> " + item.normal_min;
                }
            }
        }

        return range;

    }

    function checkValue(item){

        var value = item.value, range = false, cellValue, icon;

        if(item.normal_max && item.normal_min){
            if(value >= item.normal_min && value <= item.normal_max) range = true;
            else{
                if(value < item.normal_min) icon = "down";
                else icon = "up";
            }
        }
        else{
            if(item.normal_max){
                if(value <= item.normal_max) range = true;
                else icon = "up";
            }
            else{
                if(item.normal_min){
                    if(value >= item.normal_min) range = true;
                    else icon = "down";
                }
            }
        }

        if (range) cellValue = '<span class="normal">' + value + '</span>';
        else  cellValue = '<span class="abnormal">' + value + '<i class="fa fa-chevron-circle-' + icon + '"></i></span>';

        return cellValue;

    }

    // Helper functions (dates)

    function getAge(dateString) {
        var now = new Date();
        var today = new Date(now.getYear(), now.getMonth(), now.getDate());

        var yearNow = now.getYear();
        var monthNow = now.getMonth();
        var dateNow = now.getDate();

        var dob = new Date(dateString.substring(6, 10),
                dateString.substring(0, 2) - 1,
            dateString.substring(3, 5)
        );

        var yearDob = dob.getYear();
        var monthDob = dob.getMonth();
        var dateDob = dob.getDate();
        var age = {};
        var ageString = "";
        var yearString = "";
        var monthString = "";
        var dayString = "";


        var yearAge = yearNow - yearDob;

        if (monthNow >= monthDob)
            var monthAge = monthNow - monthDob;
        else {
            yearAge--;
            var monthAge = 12 + monthNow - monthDob;
        }

        if (dateNow >= dateDob)
            var dateAge = dateNow - dateDob;
        else {
            monthAge--;
            var dateAge = 31 + dateNow - dateDob;

            if (monthAge < 0) {
                monthAge = 11;
                yearAge--;
            }
        }

        age = {
            years: yearAge,
            months: monthAge,
            days: dateAge
        };

        if (age.years > 1) yearString = "y";
        else yearString = "y";
        if (age.months > 1) monthString = "m";
        else monthString = "m";
        if (age.days > 1) dayString = " days";
        else dayString = " day";


        if ((age.years > 0) && (age.months > 0) && (age.days > 0))
            ageString = age.years + yearString + " " + age.months + monthString;// + ", and " + age.days + dayString + " old";
        else if ((age.years == 0) && (age.months == 0) && (age.days > 0))
            ageString = age.days + dayString + " old";
        else if ((age.years > 0) && (age.months == 0) && (age.days == 0))
            ageString = age.years + yearString;// + " old. Happy Birthday!";
        else if ((age.years > 0) && (age.months > 0) && (age.days == 0))
            ageString = age.years + yearString + " and " + age.months + monthString;// + " old";
        else if ((age.years == 0) && (age.months > 0) && (age.days > 0))
            ageString = age.months + monthString; // + " and " + age.days + dayString + " old";
        else if ((age.years > 0) && (age.months == 0) && (age.days > 0))
            ageString = age.years + yearString;// + " and " + age.days + dayString + " old";
        else if ((age.years == 0) && (age.months > 0) && (age.days == 0))
            ageString = age.months + monthString;// + " old";
        else ageString = "Oops! Could not calculate age!";

        return ageString;
    }

    function formatDate(date, completeDate) {

        var d = new Date(date);

        var curr_date = d.getDate();
        curr_date = normalizeDate(curr_date);

        var curr_month = d.getMonth();
        curr_month++;
        curr_month = normalizeDate(curr_month);

        var curr_year = d.getFullYear();

        var curr_hour = d.getHours();
        curr_hour = normalizeDate(curr_hour);

        var curr_min = d.getMinutes();
        curr_min = normalizeDate(curr_min);

        var curr_sec = d.getSeconds();
        curr_sec = normalizeDate(curr_sec);

        var dateString, monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (completeDate){
            dateString = curr_date + "-" + monthNames[curr_month-1] + "-" + curr_year + " at " + curr_hour + ":" + curr_min; // + ":" + curr_sec;
        }
        else dateString = curr_date + "-" + monthNames[curr_month-1] + "-" + curr_year;

        return dateString;

    }

    function formatDateUS(date) {
        var d = new Date(date);

        var curr_date = d.getDate();
        curr_date = normalizeDate(curr_date);

        var curr_month = d.getMonth();
        curr_month++;
        curr_month = normalizeDate(curr_month);

        var curr_year = d.getFullYear();

        return curr_month + "-" + curr_date + "-" + curr_year;

    }

    function getAgeInYears(dateOfBirth) {
        var dob = new Date(dateOfBirth);
        var timeDiff = Math.abs(Date.now() - dob.getTime());
        return Math.floor(timeDiff / (1000 * 3600 * 24 * 365));
    }

    function normalizeDate(el) {
        el = el + "";
        if (el.length == 1) {
            el = "0" + el;
        }
        return el;
    }

    // display page
    login().done(function () {
        patientData().done(function() {
            $.when(
                bloodPressures(),
                getWeight(),
                getHeight(),
                getBMI(),
                getSpo2(),
                getTemperature(),
                getPulse(),
                getUKProblems(),
                getUKMedications(),
                getUKAllergies(),
                getLabs()
            ).then(logout)
        });
    });
});

