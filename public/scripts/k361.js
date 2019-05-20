// TODO: TRANSLATE

angular.module('k361', [ 'ngMaterial', 'ngMessages', 'ngAnimate', 'ngAria', 'ngTagsInput','ngFileUpload','nzToggle','angular-inview','angularViewportWatch'] ).controller( 'Controller', [ '$scope', '$http', '$window', '$interval', '$mdSidenav', '$mdDialog', '$mdToast', '$mdMedia','Upload', function ( $scope, $http, $window, $interval, $mdSidenav, $mdDialog, $mdToast, $mdMedia, Upload ) {



    $scope.$mdMedia = $mdMedia;

    $scope.WindowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    $scope.ActiveTab = 2;
    $scope.ContentReady = false;
    $scope.MobileMode = !$mdMedia('gt-sm');

    $scope.SearchText = '';
    $scope.ToolbarText = 'Życie jest lepsze z muzyką!'; // EN: Life's better with music!

    $scope.SongLimitDefault = Math.ceil(($scope.WindowHeight-144)/88)*2;
    $scope.SongLimit = $scope.SongLimitDefault;

    $scope.LoadMoreSongs = function (last,inview ) {
      if(last && inview){
        if($scope.SongLimit + 5 > $scope.Tracks.length){
          $scope.SongLimit = $scope.Tracks.length;
        } else if ($scope.SongLimit !== $scope.Tracks.length){
          $scope.SongLimit += 5;
        }
      }
    }

    $scope.PlaylistControls = {

        Days: [],
        Months: [],
        Years: [],
        Schedule: [],

        Values: {

            day: 0,
            month: 0,
            year: 0,
            hours: 0,

            track: '',
            order: 0,
            value: ''

            },

        Initiated: false

        };

        $scope.PlaylistControls.Days = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
        $scope.PlaylistControls.Months = [0,1,2,3,4,5,6,7,8,9,10,11];


    $scope.SettingsBuffer = {

        hold: false,
        playlist_designer_launch_time: '00:00:00'

        };

    $scope.Synchronization = {

        catalog: 0,
        schedule: 0,
        settings: 0

        };

    $scope.Audio = {};
    $scope.Catalog = [];
    $scope.Downloading = [];
    $scope.Playlist = [];
    $scope.Schedule = [];
    $scope.ScheduleReference = [];
    $scope.Settings = {};
    $scope.Tracks = [];
    $scope.TracksInPlaylist = [];

    $scope.MonthName = [

        'stycznia',
        'lutego',
        'marca',
        'kwietnia',
        'maja',
        'czerwca',
        'lipca',
        'sierpnia',
        'września',
        'października',
        'listopada',
        'grudnia'

        ];

    $scope.ToggleTab = function ( tab ) {

        if($scope.ActiveTab === 2 && tab !== 2){
          $scope.SongLimit = $scope.SongLimitDefault;
        }

        $scope.ActiveTab = tab;

        };

    $scope.OpenMenu = function ( ) {

        $mdSidenav('left').open();

        };

    $scope.CloseMenu = function ( ) {

        $mdSidenav('left').close();

        };

    $scope.GetDaysInMonth = function ( month, year ) {

        return ( new Date( year, month, 0 ).getDate() ); };

    $scope.GetTimeFromDate = function ( date ) {

        var Time = new Date( date );

        return ( Time.getHours() * 3600 + Time.getMinutes() * 60 + Time.getSeconds() );

        };

    $scope.TimeToText = function ( time, force_hours ) {

        var Text = '';

        if ( time > 3600 || force_hours === true ) {

            var Hours = String( Math.floor( time / 3600 ) );
            var Minutes = ( '0' + String( Math.floor( ( time % 3600 ) / 60 ) ) ).substr( -2, 2 );
            var Seconds = ( '0' + String( Math.floor( time % 60 ) ) ).substr( -2, 2 );

            if ( Hours.length == 1 ) {

                Hours = '0' + Hours; }

            Text = Hours + ':' + Minutes + ':' + Seconds; }

        else {

            var Minutes = ( '0' + String( Math.floor( ( time % 3600 ) / 60 ) ) ).substr( -2, 2 );
            var Seconds = ( '0' + String( Math.floor( time % 60 ) ) ).substr( -2, 2 );

            Text = Minutes + ':' + Seconds; }

        return Text;

        };

    $scope.TimeToWords = function ( time ) {

        var Text = '';

        if ( time >= 3600 ) {

            var Hours = Math.floor( time / 3600 );

            if ( Hours == 1 ) {

                Text = Text + "1 godzina "; }

            else if ( !( ( Hours % 100 ) > 11 && ( Hours % 100 ) < 15 ) && ( Hours % 10 ) > 1 && ( Hours % 10 ) < 5 ) {

                Text = Text + Hours + " godziny "; }

            else {

                Text = Text + Hours + " godzin "; } }

        if ( time >= 60 ) {

            var Minutes = Math.floor( ( time % 3600 ) / 60 );

            if ( Minutes == 1 ) {

                Text = Text + "1 minuta "; }

            else if ( !( ( Minutes % 100 ) > 11 && ( Minutes % 100 ) < 15 ) && ( Minutes % 10 ) > 1 && ( Minutes % 10 ) < 5 ) {

                Text = Text + Minutes + " minuty "; }

            else {

                Text = Text + Minutes + " minut "; } }

        var Seconds = time % 60;

        if ( Seconds == 1 ) {

            Text = Text + "1 sekunda"; }

        else if ( !( ( Seconds % 100 ) > 11 && ( Seconds % 100 ) < 15 ) && ( Seconds % 10 ) > 1 && ( Seconds % 10 ) < 5 ) {

            Text = Text + Seconds + " sekundy"; }

        else {

            Text = Text + Seconds + " sekund"; }

        return Text;

        };

    $scope.InitPlaylistControls = function ( ) {
        var Time = new Date();

        $scope.PlaylistControls.Values.day = Time.getDate();
        $scope.PlaylistControls.Values.month = Time.getMonth();
        $scope.PlaylistControls.Values.year = Time.getFullYear();

        if ( Time.getHours() < 7 ) {

            $scope.PlaylistControls.Values.hours = 1; }

        else if ( Time.getHours() < 17 ) {

            $scope.PlaylistControls.Values.hours = 2; }

        else {

            $scope.PlaylistControls.Values.hours = 3; }

        for ( var i = 0; i < 9; i++ ) {

            $scope.PlaylistControls.Years.push( $scope.PlaylistControls.Values.year - 4 + i ); }

        $scope.PlaylistControls.Initiated = true;

        };

    $scope.UpdatePlaylistControls = function ( ) {

        if ( !$scope.PlaylistControls.Initiated  ) {

            return; }
            if ( !$scope.ContentReady  ) {
                return;
              }

//        $scope.PlaylistControls.Months = [];

        $scope.PlaylistControls.DaysCount = $scope.GetDaysInMonth( $scope.PlaylistControls.Values.month + 1, $scope.PlaylistControls.Values.year );

        /*
        for ( var i = 1; i <= $scope.GetDaysInMonth( $scope.PlaylistControls.Values.month + 1, $scope.PlaylistControls.Values.year ); i++ ) {

            $scope.PlaylistControls.Days.push( i ); }*/
/*
        for ( var i = 0; i <= 11; i++ ) {

            $scope.PlaylistControls.Months.push( i ); }*/

        $scope.Playlist = [];

        $scope.PlaylistControls.Schedule = [];

        if ( $scope.Schedule.length == 0 ) {

            return; }

        var Begin = new Date();
        var End = new Date();

        if ( $scope.PlaylistControls.Values.hours == 1 ) {

            Begin = new Date( $scope.PlaylistControls.Values.year, $scope.PlaylistControls.Values.month, $scope.PlaylistControls.Values.day, 0, 0, 0 );
            End = new Date( $scope.PlaylistControls.Values.year, $scope.PlaylistControls.Values.month, $scope.PlaylistControls.Values.day, 7, 0, 0 ); }

        else if ( $scope.PlaylistControls.Values.hours == 2 ) {

            Begin = new Date( $scope.PlaylistControls.Values.year, $scope.PlaylistControls.Values.month, $scope.PlaylistControls.Values.day, 7, 0, 0 );
            End = new Date( $scope.PlaylistControls.Values.year, $scope.PlaylistControls.Values.month, $scope.PlaylistControls.Values.day, 17, 0, 0 ); }

        else {

            Begin = new Date( $scope.PlaylistControls.Values.year, $scope.PlaylistControls.Values.month, $scope.PlaylistControls.Values.day, 17, 0, 0 );
            End = new Date( $scope.PlaylistControls.Values.year, $scope.PlaylistControls.Values.month, $scope.PlaylistControls.Values.day, 24, 0, 0 ); }

//Binary

        var m;

        var Left = 1;
        var LeftContr = $scope.Schedule.length - 1;

        var Right = 0;
        var RightContr = $scope.Schedule.length - 2;

        if ($scope.Schedule[0].end > Begin.getTime()) {

          Left = 0;
        } else if (Left < LeftContr) {
          m = Math.floor((Left + LeftContr) / 2);
          while (!($scope.Schedule[m].end >= Begin.getTime() && $scope.Schedule[m - 1].end < Begin.getTime()) && Left <= LeftContr) {
            if ($scope.Schedule[m].end < Begin.getTime())
            Left = m + 1;
            else
            LeftContr = m - 1;
            m = Math.floor((Left + LeftContr) / 2);
            if (LeftContr === -1) break;
          }
          Left = m;
        }

        if ($scope.Schedule[$scope.Schedule.length - 1].begin < End.getTime()) {

          Right = $scope.Schedule.length - 1;
        } else if (Right < RightContr) {
          m = Math.floor((Right + RightContr) / 2);
          while (!($scope.Schedule[m + 1].begin >= End.getTime() && $scope.Schedule[m].begin < End.getTime()) && Right <= RightContr) {
            if ($scope.Schedule[m].begin < End.getTime())
            Right = m + 1;
            else {
              RightContr = m - 1;
              if (RightContr === -1) break;
            }
            m = Math.floor((Right + RightContr) / 2)
          }
          Right = m;
        }


        if (Left <= Right && Right >= 0 && Left >= 0 && ($scope.Schedule[Left].end > Begin.getTime() && $scope.Schedule[Right].begin < End.getTime())) {
          $scope.PlaylistControls.Schedule = $scope.Schedule.slice(Left, Right + 1);
        }

        if ( $scope.PlaylistControls.Schedule.length == 0 ) {

            return; }



        for ( var i = 0; i < $scope.PlaylistControls.Schedule.length; i++ ) {
            var Element = {

                type: 'TRACK',

                id: $scope.PlaylistControls.Schedule[i].id,
                title: $scope.PlaylistControls.Schedule[i].title,
                album: $scope.PlaylistControls.Schedule[i].album,
                author: $scope.PlaylistControls.Schedule[i].author,
                tags: $scope.PlaylistControls.Schedule[i].tags,


                begin: $scope.PlaylistControls.Schedule[i].begin,
                end: $scope.PlaylistControls.Schedule[i].end,

                };

            $scope.Playlist.push( Element ); }

        if ( $scope.Playlist[0].begin > Begin.getTime() ) {

            var Element = {

                type: 'PAUSE',

                begin: Begin.getTime(),
                end: $scope.Playlist[0].begin

                };

            $scope.Playlist.unshift( Element ); }

        if ( $scope.Playlist[ $scope.Playlist.length - 1 ].end < End.getTime() ) {

            var Element = {

                type: 'PAUSE',
                begin: $scope.Playlist[ $scope.Playlist.length - 1 ].end,
                end: End.getTime()

                };

            $scope.Playlist.push( Element ); }

        for ( var i = 1; i < $scope.Playlist.length; i++ ) {

            if ( $scope.Playlist[ i - 1 ].end != $scope.Playlist[i].begin && ( $scope.Playlist[i].begin - $scope.Playlist[ i - 1 ].end ) >= 1000 ) {

                var Element = {

                    type: 'PAUSE',
                    begin: $scope.Playlist[ i - 1 ].end,
                    end: $scope.Playlist[i].begin

                    };

                $scope.Playlist.splice( i, 0, Element ); } }

        for ( var i = 0; i < $scope.Playlist.length; i++ ) {

            if ( $scope.Playlist[i].type == 'TRACK' ) {

                $scope.Playlist[i].up = '';
                $scope.Playlist[i].down = '';

                if ( i > 0 ) {

                    if ( $scope.Playlist[i-1].type == 'TRACK' ) {

                        $scope.Playlist[i].up = $scope.Playlist[i-1].id; } }

                if ( i < ( $scope.Playlist.length - 1 ) ) {

                    if ( $scope.Playlist[i+1].type == 'TRACK' ) {

                        $scope.Playlist[i].down = $scope.Playlist[i+1].id; } } } }


        };

    $scope.ValidatePlaylistControls = function ( ) {

        if ( $scope.PlaylistControls.Values.track == '' ) {

            return false; }

        if ( $scope.PlaylistControls.Values.order < 1 || $scope.PlaylistControls.Values.order > 3 ) {

            return false; }

        if ( $scope.PlaylistControls.Values.value == '' ) {

            return false; }

        if ( $scope.PlaylistControls.Values.order == 1 ) {

            if ( !$scope.PlaylistControlsForm.Time.$valid ) {

                return false; } }

        else {

            var Found = false;

            for ( var i = 0; i < $scope.PlaylistControls.Schedule.length; i++ ) {

                if ( $scope.PlaylistControls.Schedule[i].id == $scope.PlaylistControls.Values.value ) {

                    Found = true;

                    break; } }

            if ( !Found ) {

                return false; } }

        return true;

        };

    $scope.AddTrackToPlaylist = function ( ) {

        var Direction = 1;
        var Begin = new Date();

        if ( $scope.PlaylistControls.Values.order == 1 ) {

            var Delta = 0;

            if ( $scope.PlaylistControls.Values.value.length == 7 ) {

                Delta = 1; }

            var Hours = parseInt( $scope.PlaylistControls.Values.value.substr( 0, 2 - Delta ) );
            var Minutes = parseInt( $scope.PlaylistControls.Values.value.substr( 3 - Delta, 2 ) );
            var Seconds = parseInt( $scope.PlaylistControls.Values.value.substr( 6 - Delta, 2 ) );

            Begin = new Date( $scope.PlaylistControls.Values.year, $scope.PlaylistControls.Values.month, $scope.PlaylistControls.Values.day, Hours, Minutes, Seconds ); }

        else {

            for ( var i = 0; i < $scope.Schedule.length; i++ ) {

                if ( $scope.Schedule[i].id == $scope.PlaylistControls.Values.value ) {

                    if ( $scope.PlaylistControls.Values.order == 2 ) {

                        Begin = new Date( $scope.Schedule[i].end ); }

                    else {

                        Direction = -1;
                        Begin = new Date( $scope.Schedule[i].begin ); }

                    break; } } }

        $http.post( '/playlist/add', {

            track: $scope.PlaylistControls.Values.track,
            begin: Begin.getTime(),
            direction: Direction

            } ).then(

                function ( response ) {

                    // NOTHING

                    },

                function ( response ) {

                  if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';
                    console.log( "ERROR #" + response.status + " IN ADD_TRACK_TO_PLAYLIST: " + response.data );

                    if ( response.status == 409 ) {

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Ścieżka jest w konflikcie z inną ścieżką. Wprowadź poprawny czas odtwarzania.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        }

                    else {

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Podczas dodawania ścieżki do playlisty wystąpił błąd! Spróbuj ponownie.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        }

                    }

                );

        };

    $scope.SwapTracksInPlaylist = function ( first, second ) {

        $http.post( '/playlist/swap', {

            first: first,
            second: second

            } ).then(

                function ( response ) {

                    // NOTHING

                    },

                function ( response ) {
                  if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                    console.log( "ERROR #" + response.status + " IN SWAP_TRACKS_IN_PLAYLIST: " + response.data );

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podczas zamieniania kolejności ścieżek wystąpił błąd. Spróbuj ponownie.' )
                            .position( 'bottom right' )
                            .hideDelay( 5000 )

                        );

                    }

                );

        };

    $scope.RemoveTrackFromPlaylist = function ( track ) {
        $http.post( '/playlist/remove', {

            id: track

            } ).then(

                function ( response ) {

                    // NOTHING
                    },

                function ( response ) {
                  if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                    console.log( "ERROR #" + response.status + " IN REMOVE_TRACK_FROM_PLAYLIST: " + response.data );

                    $mdToast.show(

                        $mdToast.simple()
                            .textContent( 'Podczas usuwania ścieżki wystąpił błąd. Spróbuj ponownie.' )
                            .position( 'bottom right' )
                            .hideDelay( 5000 )

                        );

                    }

                );

        };


//TODO Fix searching to show every track


SearchFunction = function(SearchedArray, SearchedText){
  if(SearchedText === undefined)return;
  SearchedArray = $scope.Catalog;

  if ( SearchedText.length >= 3 ) {

    SearchedText = SearchedText.toLowerCase();

    SearchedText = SearchedText.split(';');

    for(var i = 0;i<SearchedText.length;i++){

      SearchParameter = SearchedText[i].split(':');
      SearchParameter[0] = SearchParameter[0].trim();

      if(SearchParameter.length > 1 && SearchParameter[0].toLowerCase() === 'tags'){
        SearchParameter[1] = SearchParameter[1].trim().replace(/\s+/g,'-');

        SearchedArray = SearchedArray.filter(function(item){
          if(!item.tags.length || !SearchParameter[1].length)return false;

        for(tags in item.tags){
          if((item.tags[tags].text.toLowerCase()).indexOf(SearchParameter[1]) > -1)
            return true;
        }

        return false;
        });

      } else if(SearchParameter.length > 1 && SearchParameter[0].toLowerCase() === 'length'){

        SearchParameter[1] = SearchParameter[1].trim().replace(/\s+/g,'').split(',');

        var IsRanged = true;
        var Values = {'<':'','>':'','=':''};
        for(var j=0;j<SearchParameter[1].length;j++){
          var value = parseInt(SearchParameter[1][j].replace(/\D/g,''));
          if(isNaN(value) || (value === 0 && SearchParameter[1][j].indexOf('>') === -1))continue;
          if(SearchParameter[1][j].indexOf('>') !== -1){
            if(IsRanged)
              Values['>'] = value;
          } else if(SearchParameter[1][j].indexOf('<') !== -1){
              if(IsRanged)
                Values['<'] = value;
          } else {
            IsRanged = false;
            Values['='] = value;

          }
        }

        SearchedArray = SearchedArray.filter(function(item){

          if(item.length === Values['=']) return true;
          else if(Values['>'] !== '' && item.length > Values['>'])return true;
          else if(Values['<'] !== '' && item.length < Values['<'])return true;
        return false;
        });
      }else {
        SearchedArray = SearchedArray.filter(function(item){
        if((item.title.toLowerCase()).indexOf(SearchParameter[0]) > -1)
          return true;
        if((item.author.toLowerCase()).indexOf(SearchParameter[0]) > -1)
          return true;
        if((item.album.toLowerCase()).indexOf(SearchParameter[0]) > -1)
          return true;

        return false;
        });
      }

    }



//$scope.$broadcast('toggleWatchers', true);
  }
    return SearchedArray;
}


    $scope.SearchInCatalog = function ( ) {

        $scope.Tracks = SearchFunction($scope.Tracks, $scope.SearchText);
      if($scope.SearchText.length >= 3){
        $scope.SongLimit = $scope.SongLimitDefault > $scope.Tracks.length ? $scope.Tracks.length: $scope.SongLimitDefault;
        } else if($scope.SongLimit < $scope.SongLimitDefault && $scope.Tracks.length > $scope.SongLimitDefault){
	$scope.SongLimit = $scope.SongLimitDefault;
}

      };


    $scope.SearchInPlaylistCatalog = function ( ) {
      $scope.TracksInPlaylist = SearchFunction($scope.TracksInPlaylist, $scope.SearchTextPlaylist);
      };


    $scope.CreateTrack = function ( event ) {

        $mdDialog.show( {

            controller: CreateTrackController,
            templateUrl: 'k361-create-track.html',
            parent: angular.element( document.body ),
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true

            } ).then(

                function ( response ) {

                    if ( response.service == 'YOUTUBE' ) {

                        var Code = response.link.match( /(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/ );

                        if( Code != null ) {

                            $http.post( '/library/download', {

                                service: 'YOUTUBE',
                                code: Code[1]

                                } ).then(

                                    function ( response ) {

                                        $scope.Downloading.push( response.data );

                                        $mdToast.show(

                                            $mdToast.simple()
                                                .textContent( 'Ścieżka #' + response.data + " zostanie wkrótce pobrana!" )
                                                .position( 'bottom right' )
                                                .hideDelay( 3000 )

                                            );

                                        },

                                    function ( response ) {
                                      if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                                        console.log( "ERROR #" + response.status + " IN CREATE_TRACK: " + response.data );

                                        $mdToast.show(

                                            $mdToast.simple()
                                                .textContent( 'Podczas tworzenia ścieżki wystąpił błąd! Spróbuj ponownie.' )
                                                .position( 'bottom right' )
                                                .hideDelay( 5000 )

                                            );

                                        }

                                    );

                            }

                        else {

                            console.log( "ERROR IN CREATE_TRACK: YOUTUBE LINK DOES NOT MATCH THE PATTERN" );

                            $mdToast.show(

                                $mdToast.simple()
                                    .textContent( 'Podczas tworzenia ścieżki wystąpił błąd! Spróbuj ponownie.' )
                                    .position( 'bottom right' )
                                    .hideDelay( 5000 )

                                );

                            }

                        } else if (response.service == 'LOCAL' ){
                          if (response.file) {
                            var configgg = {
                              headers: {'Content-Type': undefined},
                              transformRequest: []
                            }
                            var data = {
                              service: 'LOCAL'
                            }
                                        if (!response.file.$error) {
                                          $mdToast.show(

                                              $mdToast.simple()
                                                  .textContent( 'Rozpoczęto wysyłanie pliku ' + response.file.name )
                                                  .position( 'bottom right' )
                                                  .hideDelay( 3000 )

                                              );

                                          Upload.upload({
                    url: '/library/download',
                    data: {
                      service: 'LOCAL',
                      file: response.file
                    }
                }).then(

                    function ( response ) {

                        $scope.Downloading.push( response.data );
                        },

                    function ( response ) {
                      if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                        console.log( "ERROR #" + response.status + " IN CREATE_TRACK: " + response.data );

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Podczas tworzenia ścieżki wystąpił błąd! Spróbuj ponownie.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        }

                    );



                                        }

                                  }
                        }

                    },

                function ( response ) {

                    } );

        };

    $scope.EditTrack = function ( track, event ) {

        $mdDialog.show( {

            controller: EditTrackController,
            templateUrl: 'k361-edit-track.html',
            locals: { track: track },
            parent: angular.element( document.body ),
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true

            } ).then(

                function ( response ) {

                    if ( response == 'ERROR' ) {

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Podczas uzyskiwania danych o ścieżce wystąpił błąd! Spróbuj ponownie.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        return; }

                    $http.post( '/library/track', {

                        id: track,

                        title: response.title,
                        album: response.album,
                        author: response.author,
                        tags: response.tags,

                        begin: response.begin,
                        end: response.end,

                        volume: response.volume,
                        rate: response.rate

                        } ).then(

                            function ( response ) {

                                // CODE

                                },

                            function ( response ) {
                              if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                                console.log( "ERROR #" + response.status + " IN EDIT_TRACK: " + response.data );

                                $mdToast.show(

                                    $mdToast.simple()
                                        .textContent( 'Podczas edytowania ścieżki wystąpił błąd! Spróbuj ponownie.' )
                                        .position( 'bottom right' )
                                        .hideDelay( 5000 )

                                    );

                                }

                            );

                    },

                function ( response ) {

                    // NOTHING

                    }

                );

        };

    $scope.RemoveTrack = function ( track ) {

        $http.post( '/library/remove', {

            id: track

            } ).then(

            function ( response ) {

                // CODE

                },

            function ( response ) {
              if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                console.log( "ERROR #" + response.status + " IN REMOVE_TRACK: " + response.data );

                $mdToast.show(

                    $mdToast.simple()
                        .textContent( 'Podczas usuwania ścieżki wystąpił błąd! Spróbuj ponownie.' )
                        .position( 'bottom right' )
                        .hideDelay( 5000 )

                    );

                }

            );

        };

    $scope.SelectTrack = function ( track ) {

        $scope.ActiveTab = 1;
        $scope.PlaylistControls.Values.track = track;

        };

    $scope.ToggleTrack = function ( track ) {

        if ( $scope.Audio.playing && $scope.Audio.track == track ) {

            $scope.StopTrack( track ); }

        else {

            $scope.PlayTrack( track ); }

        };

    $scope.PlayTrack = function ( track ) {

        $http.post( '/playlist/play', {

            id: track

            } ).then(

                function ( response ) {

                    $scope.Audio.playing = true;
                    $scope.Audio.track = track;

                    $scope.Synchronize();

                    },

                function ( response ) {
                  if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                    console.log( "ERROR #" + response.status + " IN PLAY_NOW: " + response.data );

                    if ( response.status == 409 ) {

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Ścieżka nie może zostać odtworzona podczas zastrzeżonych godzin.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        }

                    else {

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Podczas odtwarzania ścieżki wystąpił błąd! Spróbuj ponownie.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        }

                    }

                );

        };

    $scope.StopTrack = function ( track ) {

        $http.get( '/playlist/stop' ).then(

            function ( response ) {

                $scope.Audio.playing = false;
                $scope.Audio.track = '';

                $scope.Synchronize();

                },

            function ( response ) {
              if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                console.log( "ERROR #" + response.status + " IN STOP_NOW: " + response.data );

                $mdToast.show(

                    $mdToast.simple()
                        .textContent( 'Podczas zatzymywania odtwarzania ścieżki wystąpił błąd! Spróbuj ponownie.' )
                        .position( 'bottom right' )
                        .hideDelay( 5000 )

                    );

                }

            );

        };

    $scope.EditTimeIntervals = function ( event, intervals, trigger ) {

        if ( typeof( trigger ) != 'undefined' ) {

            if ( trigger == false ) {

                return; } }

        $mdDialog.show( {

            controller: EditTimeIntervalsController,
            templateUrl: 'k361-edit-time-intervals.html',
            locals: { intervals: intervals },
            parent: angular.element( document.body ),
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true

            } ).then(

                function ( response ) {

                    // NOTHING

                    },

                function ( ) {

                    // NOTHING

                    }

                );

        };

    $scope.CleanPlaylist = function ( ) {

        $http.get( '/playlist/clean' ).then(

            function ( response ) {

                $mdToast.show(

                    $mdToast.simple()
                        .textContent( 'Playlista została wyczyszczona pomyślnie!' )
                        .position( 'bottom right' )
                        .hideDelay( 3000 )

                    );

                },

            function ( response ) {
              if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                console.log( "ERROR #" + response.status + " IN CLEAN_PLAYLIST: " + response.data );

                $mdToast.show(

                    $mdToast.simple()
                        .textContent( 'Podczas czyszczenia playlisty wystąpił błąd! Spróbuj ponownie.' )
                        .position( 'bottom right' )
                        .hideDelay( 5000 )

                    );

                }

            );

        };

    $scope.ClearServerData = function ( event ) {

        var Dialog = $mdDialog.confirm ( )
            .title( 'Czyszczenie danych serwera' )
            .textContent( 'Akcja ta spowoduje nieodwracalne usunięcie wszelkich danych z serwera, w tym zawartości biblioteki oraz playlisty. Czy na pewno chcesz kontynuować?' )
            .ariaLabel( 'Czyszczenie danych serwera' )
            .targetEvent( event )
            .ok( 'Tak, kontynuuj' )
            .cancel( 'Nie, przerwij akcję' );

        $mdDialog.show( Dialog ).then(

            function ( ) {

                $http.get( '/state/reset' ).then(

                    function ( response ) {

                        $window.location.href = '/';

                        },

                    function ( response ) {
                      if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                        console.log( "ERROR #" + response.status + " IN CLEAR_SERVER_DATA: " + response.data );

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Podczas czyszczenia danych serwera wystąpił błąd! Spróbuj ponownie.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        }

                    );

                },

            function ( ) {

                // NOTHING

                }

            );

    };

    $scope.ShutdownServer = function ( ) {

        $http.get( '/state/shutdown' ).then(

            function ( response ) {

                $window.location.href = '/';

                },

            function ( response ) {
              if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                console.log( "ERROR #" + response.status + " IN SHUTDOWN_SERVER: " + response.data );

                $mdToast.show(

                    $mdToast.simple()
                        .textContent( 'Podczas wyłączania serwera wystąpił błąd! Spróbuj ponownie.' )
                        .position( 'bottom right' )
                        .hideDelay( 5000 )

                    );

                }

            );

        };

    $scope.Logout = function ( ) {

        $http.get( '/library/clean' ).then(

            function ( response ) {

                $http.get( '/logout' ).then(

                    function ( subresponse ) {

                        $window.location.href = '/';

                        },

                    function ( subresponse ) {
                      if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                        console.log( "ERROR #" + subresponse.status + " IN LOGOUT: " + subresponse.data );

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Podczas wylogowywania wystąpił błąd! Spróbuj ponownie.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        }

                    );

                },

            function ( response ) {
              if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                console.log( "ERROR #" + response.status + " IN LOGOUT: " + response.data );

                $mdToast.show(

                    $mdToast.simple()
                        .textContent( 'Podczas wylogowywania wystąpił błąd! Spróbuj ponownie.' )
                        .position( 'bottom right' )
                        .hideDelay( 5000 )

                    );

                }

            );

        };

    $scope.ChangeAmplifireMode = function(){
      $scope.Settings.amplifier_toggle = $scope.amplifierToggle;
    };

    $scope.Synchronize = function ( ) {
        $http.post( '/state/synchronize', {

            catalog: $scope.Synchronization.catalog,
            schedule: $scope.Synchronization.schedule,
            settings: $scope.Synchronization.settings

            } ).then(

                function ( response ) {

                    $scope.Audio = response.data.audio;

                    if ( response.data.catalog.timestamp > $scope.Synchronization.catalog ) {

                        $scope.Synchronization.catalog = response.data.catalog.timestamp;

                        for ( var i = 0; i < response.data.catalog.updated.length; i++ ) {

                            var Done = false;

                            for ( var j = 0; j < $scope.Catalog.length; j++ ) {

                                if ( $scope.Catalog[j].id == response.data.catalog.updated[i].id ) {

                                    $scope.Catalog[j] = response.data.catalog.updated[i];

                                    Done = true; break; } }

                            if ( !Done ) {

                                $scope.Catalog.push( response.data.catalog.updated[i] ); } }

                        for ( var i = 0; i < response.data.catalog.removed.length; i++ ) {

                            for ( var j = 0; j < $scope.Catalog.length; j++ ) {

                                if ( $scope.Catalog[j].id == response.data.catalog.removed[i].id ) {

                                    $scope.Catalog.splice( j, 1 );

                                    break; } } }

                        $scope.Catalog.sort(

                            function ( a, b ) {

                              if ( a.title.toLowerCase() < b.title.toLowerCase() ) {

                                  return -1; }

                              if ( a.title.toLowerCase() > b.title.toLowerCase() ) {

                                  return 1; }

                                if ( a.author.toLowerCase() < b.author.toLowerCase() ) {

                                    return -1; }

                                if ( a.author.toLowerCase() > b.author.toLowerCase() ) {

                                    return 1; }

                                if ( a.album.toLowerCase() < b.album.toLowerCase() ) {

                                    return -1; }

                                if ( a.album.toLowerCase() > b.album.toLowerCase() ) {

                                    return 1; }



                                return 0; } );


                        $scope.SearchInCatalog();
                        $scope.SearchInPlaylistCatalog();

                      }
                    if ( response.data.schedule.timestamp > $scope.Synchronization.schedule ) {

                        $scope.Schedule = response.data.schedule.data;
                        $scope.Synchronization.schedule = response.data.schedule.timestamp;

                        for ( var i = 0; i < $scope.Schedule.length; i++ ) {

                            var Title = '';
                            var Album = '';
                            var Author = '';
                            var Tags = [];


                            for ( var j = 0; j < $scope.Catalog.length; j++ ) {

                                if ( $scope.Catalog[j].id == $scope.Schedule[i].track ) {

                                    Title = $scope.Catalog[j].title;
                                    Album = $scope.Catalog[j].album;
                                    Author = $scope.Catalog[j].author;
                                    Tags = $scope.Catalog[j].tags;

                                    break; } }

                            $scope.Schedule[i].title = Title;
                            $scope.Schedule[i].album = Album;
                            $scope.Schedule[i].author = Author;
                            $scope.Schedule[i].tags = Tags;


                            if ( Title.length > 23 ) {

                                Title = Title.substr( 0, 20 ) + '...'; }

                            if ( Author.length > 23 ) {

                                Author = Author.substr( 0, 20 ) + '...'; }

                            $scope.Schedule[i].text = $scope.TimeToText( $scope.GetTimeFromDate( $scope.Schedule[i].begin ), true ) + ' | ' + Title + ' - ' + Author; }

                        $scope.UpdatePlaylistControls();
                       }
                    //   console.log($scope.SettingsLastSync,$scope.Settings); //TODO
                    if ( response.data.settings.timestamp > $scope.Synchronization.settings ) {

                        $scope.SettingsBuffer.hold = true;

                        $scope.Settings = response.data.settings.data;
                        $scope.SettingsLastSync = JSON.parse(JSON.stringify(response.data.settings.data));
                        $scope.Synchronization.settings = response.data.settings.timestamp;

                        $scope.SettingsBuffer.playlist_designer_launch_time = $scope.TimeToText( $scope.Settings.playlist_designer_launch_time,true ); }

                    $scope.SynchronizeToolbar();

                    },

                function ( response ) {
                  if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                    console.log( "ERROR #" + response.status + " IN SYNCRONIZE_WITH_SERVER: " + response.data );

                    }

            );

        for ( var i = 0; i < $scope.Downloading.length; i++ ) {

            $http.get( '/library/track?id=' + $scope.Downloading[i] ).then(

                function ( response ) {

                    if ( response.data.state == 'ERROR' ) {

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Podczas pobierania ścieżki #' + response.data.id + ' wystąpił błąd! Spróbuj ponownie.' )
                                .position( 'bottom right' )
                                .hideDelay( 5000 )

                            );

                        for ( var i = 0; i < $scope.Downloading.length; i++ ) {

                            if ( $scope.Downloading[i] == response.data.id ) {

                                $scope.Downloading.splice( i, 1 );

                                break; } } }

                    else if ( response.data.state == 'READY' ) {

                        var Title = response.data.title;
                        if ( Title.length > 40 ) {

                            Title = Title.substr( 0, 37 ) + '...'; }

                        $mdToast.show(

                            $mdToast.simple()
                                .textContent( 'Ścieżka \'' + Title + '\' została pobrana pomyślnie!' )
                                .position( 'bottom right' )
                                .hideDelay( 3000 )

                            );

                            if(response.data.album === 'Local'){
                              $scope.EditTrack(response.data.id);
                            }

                        for ( var i = 0; i < $scope.Downloading.length; i++ ) {

                            if ( $scope.Downloading[i] == response.data.id ) {

                                $scope.Downloading.splice( i, 1 );

                                break; } } }

                    },

                function ( response ) {
                  if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                    console.log( "ERROR #" + response.status + " IN SYNCHRONIZE: " + response.data );

                    }

                );

            }

        };

    $scope.SynchronizeToolbar = function ( ) {

        $scope.ToolbarText = 'Życie jest lepsze z muzyką!'; // EN: Life's better with music!

        if ( $scope.Audio.playing ) {

            for ( var i = 0; i < $scope.Catalog.length; i++ ) {

                if ( $scope.Catalog[i].id == $scope.Audio.track ) {

                    $scope.ToolbarText = $scope.Catalog[i].title + ' | ' + $scope.Catalog[i].author + ' - ' + $scope.Catalog[i].album;

                    break; } } }

        };

    $scope.Setup = function ( ) {
        var LibraryReady = false;
        var PlaylistReady = false;
        var SettingsReady = false;

        $http.get( '/library' ).then(

            function ( response ) {

                $scope.Catalog = response.data.catalog;
                $scope.Tracks = $scope.Catalog;
                $scope.TracksInPlaylist = $scope.Catalog;

                $scope.Synchronization.catalog = response.data.timestamp;

                LibraryReady = true;

                if ( PlaylistReady && SettingsReady ) {

                    $scope.ContentReady = true;

                    $interval( $scope.Synchronize, $scope.Settings.synchronization_delay ); }

                $scope.Catalog.sort(

                    function ( a, b ) {

                      if ( a.title.toLowerCase() < b.title.toLowerCase() ) {

                          return -1; }

                      if ( a.title.toLowerCase() > b.title.toLowerCase() ) {

                          return 1; }

                        if ( a.author.toLowerCase() < b.author.toLowerCase() ) {

                            return -1; }

                        if ( a.author.toLowerCase() > b.author.toLowerCase() ) {

                            return 1; }

                        if ( a.album.toLowerCase() < b.album.toLowerCase() ) {

                            return -1; }

                        if ( a.album.toLowerCase() > b.album.toLowerCase() ) {

                            return 1; }



                        return 0; } );

                $scope.SearchInCatalog();

                if ( PlaylistReady ) {

                    for ( var i = 0; i < $scope.Schedule.length; i++ ) {

                        var Title = '';
                        var Album = '';
                        var Author = '';
                        var Tags = [];


                        for ( var j = 0; j < $scope.Catalog.length; j++ ) {

                            if ( $scope.Catalog[j].id == $scope.Schedule[i].track ) {

                                Title = $scope.Catalog[j].title;
                                Album = $scope.Catalog[j].album;
                                Author = $scope.Catalog[j].author;
                                Tags = $scope.Catalog[j].tags;

                                break; } }

                        $scope.Schedule[i].title = Title;
                        $scope.Schedule[i].album = Album;
                        $scope.Schedule[i].author = Author;
                        $scope.Schedule[i].tags = Tags;

                        if ( Title.length > 23 ) {

                            Title = Title.substr( 0, 20 ) + '...'; }

                        if ( Author.length > 23 ) {

                            Author = Author.substr( 0, 20 ) + '...'; }

                        $scope.Schedule[i].text = $scope.TimeToText( $scope.GetTimeFromDate( $scope.Schedule[i].begin ), true ) + ' | ' + Title + ' - ' + Author; } }
                        $scope.UpdatePlaylistControls();

                },

            function ( response ) {
              if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                console.log( "ERROR #" + response.status + " IN SETUP: " + response.data );

                // TODO: ERROR MESSAGE

                }

            );

        $http.get( '/playlist' ).then(

            function ( response ) {

                $scope.Audio = response.data.audio;
                $scope.Schedule = response.data.schedule;
                $scope.Synchronization.schedule = response.data.timestamp;

                PlaylistReady = true;

                if ( LibraryReady && SettingsReady ) {

                    $scope.ContentReady = true;

                    $interval( $scope.Synchronize, $scope.Settings.synchronization_delay ); }

                $scope.InitPlaylistControls();



                if ( LibraryReady ) {

                    for ( var i = 0; i < $scope.Schedule.length; i++ ) {

                        var Title = '';
                        var Album = '';
                        var Author = '';
                        var Tags = [];


                        for ( var j = 0; j < $scope.Catalog.length; j++ ) {

                            if ( $scope.Catalog[j].id == $scope.Schedule[i].track ) {

                                Title = $scope.Catalog[j].title;
                                Album = $scope.Catalog[j].album;
                                Author = $scope.Catalog[j].author;
                                Tags = $scope.Catalog[j].tags;

                                break; } }

                        $scope.Schedule[i].title = Title;
                        $scope.Schedule[i].album = Album;
                        $scope.Schedule[i].author = Author;
                        $scope.Schedule[i].tags = Tags;



                        if ( Title.length > 23 ) {

                            Title = Title.substr( 0, 20 ) + '...'; }

                        if ( Author.length > 23 ) {

                            Author = Author.substr( 0, 20 ) + '...'; }

                        $scope.Schedule[i].text = $scope.TimeToText( $scope.GetTimeFromDate( $scope.Schedule[i].begin ), true ) + ' | ' + Title + ' - ' + Author; } }
                        $scope.UpdatePlaylistControls();

                },

            function ( response ) {
              if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                console.log( "ERROR #" + response.status + " IN SETUP: " + response.data );

                // TODO: ERROR MESSAGE

                }

            );

        $http.get( '/state' ).then(

            function ( response ) {

                $scope.SettingsBuffer.hold = true;

                $scope.Settings = response.data.settings;

                $scope.SettingsLastSync = JSON.parse(JSON.stringify(response.data.settings));

                $scope.amplifierToggle = $scope.Settings.amplifier_toggle;

                $scope.Synchronization.settings = response.data.timestamp;

                $scope.SettingsBuffer.playlist_designer_launch_time = $scope.TimeToText( $scope.Settings.playlist_designer_launch_time,true );

                SettingsReady = true;

                if ( LibraryReady && PlaylistReady ) {

                    $scope.ContentReady = true;

                    $interval( $scope.Synchronize, $scope.Settings.synchronization_delay ); }

                },

            function ( response ) {
              if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                console.log( "ERROR #" + response.status + " IN SETUP: " + response.data );

                // TODO: ERROR MESSAGE

                }

            );

        };

    $scope.$watch( function ( ) { return $mdMedia('gt-sm'); }, function( DesktopMode ) {

        $scope.MobileMode = !DesktopMode;

        } );

        $scope.$watch( function ( ) { return window.innerHeight }, function( height ) {

            $scope.WindowHeight = height;

            $scope.SongLimitDefault = Math.ceil(($scope.WindowHeight-144)/88)*2;

            if($scope.SongLimit < $scope.SongLimitDefault){
              $scope.SongLimit = $scope.SongLimitDefault
            }

            } );

    $scope.$watch( function ( ) { return $scope.PlaylistControls.Values; }, function ( ) {

        $scope.UpdatePlaylistControls();

        }, true );

    $scope.$watch( function ( ) { return $scope.SettingsBuffer.playlist_designer_launch_time }, function( ) {

        if ( typeof ( $scope.Settings.playlist_designer_launch_time ) == 'undefined' ) {

            return; }

        var Input = $scope.SettingsBuffer.playlist_designer_launch_time;

        if ( typeof ( Input ) == 'undefined' ) {

            return; }

        if ( Input == '' ) {

            return; }

        var Delta = 0;

        if ( Input.length == 7 ) {

            Delta = 1; }

        var Hours = parseInt( Input.substr( 0, 2 - Delta ) );
        var Minutes = parseInt( Input.substr( 3 - Delta, 2 ) );
        var Seconds = parseInt( Input.substr( 6 - Delta, 2 ) );

        var Output = Hours * 3600 + Minutes * 60 + Seconds;

        if ( Output == $scope.Settings.playlist_designer_launch_time ) {

            return; }

        $scope.Settings.playlist_designer_launch_time = Output;

        } );

    $scope.$watch( function ( ) { return $scope.Settings; }, function ( ) {
      //Known problems - objects are
      var SettingsChanges = {};


        /*if ( $scope.SettingsBuffer.hold ) {
          console.log("DUPA");
            $scope.SettingsBuffer.hold = false;

            return; }*/

            for (var prop in $scope.Settings) {
              if(!angular.equals($scope.Settings[prop], $scope.SettingsLastSync[prop])){
                SettingsChanges[prop] = $scope.Settings[prop];
                break;
              }
            }

            if ( angular.equals( SettingsChanges, {} ) ) {
                return; }

            $scope.SettingsLastSync = JSON.parse(JSON.stringify($scope.Settings));
        $http.post( '/state', {

            settings: SettingsChanges

            } ).then(

                function ( response ) {

                    // NOTHING

                    },

                function ( response ) {
                  if(parseInt(response.status) === -1 || parseInt(response.status) === 401)$window.location.href = '/';

                    console.log( "ERROR #" + response.status + " IN SYNCHRONIZE: " + response.data );

                    }

                );

        }, true );

    } ] )/*.directive('onScroll',function () {
    return function (scope, elm, attr) {
      var raw = elm[0];
      var Buffering = false;

      elm.on('scroll', function(){
        window.requestAnimationFrame(ScrollingFunc = function (e) {
          if(scope.ActiveTab === 2){

            //-80-88*7
            if(raw.querySelector('#Library').offsetHeight - raw.scrollTop -696 < scope.WindowHeight){
              scope.LoadMoreSongs();
            }
          }
        });

      });

    };
  })
*/
  .directive('inputslider',function () {
  return {
    require: ['ngModel'],
    scope: {
      max:'@',
      format: '@'
    },
    link: function (scope, elm, attr, ctrls) {
     var ngModelCtrl = ctrls[0];
     var MaxValue = parseInt(scope.max);


     attr.$observe('max', function(value){
				MaxValue = parseInt(scope.max);
			});

              if(scope.format === 'rate'){
                var formatter = function (value){

                  var newValue = value.toString().match(/\d{1,2}/);
                    return newValue == null ? '0/'+MaxValue : (newValue[0] > 10 ? '10/'+MaxValue : newValue[0]+'/'+MaxValue);
                }
                var parser = function (value){

                    var newValue = parseInt(value.toString().match(/\d{1,2}/));

                    return isNaN(newValue) ? 0 : (newValue > MaxValue ? 10 : newValue);
                }

                elm.on("blur", function () {
                  ngModelCtrl.$setViewValue(formatter(this.value));
                  ngModelCtrl.$render();

                }).on("focus", function () {
                    ngModelCtrl.$setViewValue(parser(this.value));
                    ngModelCtrl.$render();
                });
              } else if(scope.format === 'time'){
                formatter = function ( time ) {

                    if(time > MaxValue)
                      time = MaxValue;

                    var Text = '';

                    if ( time > 3600 ) {

                        var Hours = String( Math.floor( time / 3600 ) );
                        var Minutes = ( '0' + String( Math.floor( ( time % 3600 ) / 60 ) ) ).substr( -2, 2 );
                        var Seconds = ( '0' + String( Math.floor( time % 60 ) ) ).substr( -2, 2 );

                        if ( Hours.length == 1 ) {

                            Hours = '0' + Hours; }

                        Text = Hours + ':' + Minutes + ':' + Seconds; }

                    else {

                        var Minutes = ( '0' + String( Math.floor( ( time % 3600 ) / 60 ) ) ).substr( -2, 2 );
                        var Seconds = ( '0' + String( Math.floor( time % 60 ) ) ).substr( -2, 2 );

                        Text = Minutes + ':' + Seconds; }

                    return Text;

                    };

                    parser = function(value) {

                      value = value.split(':');
                      var timeSum = 0;

                      for(var i =0;i<value.length;i++){

                        timeSum *= 60;
                        if(isNaN(parseInt(value[i])))
                          continue;
                        timeSum += parseInt(value[i]);
                      }

                      return timeSum > MaxValue ? MaxValue : timeSum;

                    }

                    elm.on("blur", function () {
                      ngModelCtrl.$setViewValue(formatter(parser(this.value)));
                      ngModelCtrl.$render();
                    });
              }
                ngModelCtrl.$formatters.push(formatter);

                ngModelCtrl.$parsers.push(parser);
  }



};
}).config( function( $mdThemingProvider) {
        } );

function CreateTrackController ( $scope, $mdDialog ) {

    $scope.YoutubeLink = '';

    $scope.hide = function ( ) {

        $mdDialog.hide();

        };

    $scope.cancel = function ( ) {

        $mdDialog.cancel();

        };

    $scope.respond = function( response ) {

        $mdDialog.hide( response );

        };

        $scope.uploadFile = function(file){
          $scope.file = file;

          if(file !== undefined && file !== null){
            $mdDialog.hide(  { service: 'LOCAL', file: file } );
          }
        }

        /*
        $scope.$watch('file', function () {

          if($scope.file !== undefined && $scope.file !== null){
            $mdDialog.hide(  { service: 'LOCAL', file: $scope.file } );
          } else {
            $scope.file = undefined;
          }*/


    }

function EditTrackController ( $scope, $http, $mdDialog, track ) {

    $scope.TimeToLive = 10;
    $scope.TrackReady = false;

    $scope.Track = {

        title: '',
        album: '',
        author: '',
        tags: [],

        length: 36000,
        begin: 0,
        end: 0,

        volume: 0,
        rate: 0

        };

    $scope.TimeToText = function ( time, force_hours ) {

        var Text = '';

        if ( time > 3600 || force_hours === true ) {

            var Hours = String( Math.floor( time / 3600 ) );
            var Minutes = ( '0' + String( Math.floor( ( time % 3600 ) / 60 ) ) ).substr( -2, 2 );
            var Seconds = ( '0' + String( Math.floor( time % 60 ) ) ).substr( -2, 2 );

            if ( Hours.length == 1 ) {

                Hours = '0' + Hours; }

            Text = Hours + ':' + Minutes + ':' + Seconds; }

        else {

            var Minutes = ( '0' + String( Math.floor( ( time % 3600 ) / 60 ) ) ).substr( -2, 2 );
            var Seconds = ( '0' + String( Math.floor( time % 60 ) ) ).substr( -2, 2 );

            Text = Minutes + ':' + Seconds; }

        return Text;

        };

    $scope.Setup = function ( ) {

        $http.get( '/library/track?id=' + track ).then(

            function ( response ) {

                $scope.Track.title = response.data.title;
                $scope.Track.album = response.data.album;
                $scope.Track.author = response.data.author;
                $scope.Track.tags = response.data.tags;
                $scope.Track.length = response.data.length;
                $scope.Track.begin = response.data.begin;
                $scope.Track.end = response.data.end;
                $scope.Track.volume = response.data.volume;
                $scope.Track.rate = response.data.rate;

                $scope.TrackReady = true;
                },

            function ( response ) {

                if ( $scope.TimeToLive > 0 ) {

                    $scope.Setup();

                    $scope.TimeToLive--; }

                else {

                    $scope.respond('ERROR'); }

                }

            );

        };

    $scope.hide = function ( ) {

        $mdDialog.hide();

        };

    $scope.cancel = function ( ) {

        $mdDialog.cancel();

        };

    $scope.respond = function( response ) {

        $mdDialog.hide( response );

        };

    }

function EditTimeIntervalsController ( $scope, $mdDialog, $mdMedia, intervals ) {

    $scope.$mdMedia = $mdMedia;

    $scope.Selected = intervals.length;
    $scope.Days = [ false, false, false, false, false, false, false ];
    $scope.Begin = '00:00:00';
    $scope.End = '00:00:00';

    $scope.Intervals = intervals;

    $scope.TimeToText = function ( time, force_hours ) {

        var Text = '';

        if ( time > 3600 || force_hours === true ) {

            var Hours = String( Math.floor( time / 3600 ) );
            var Minutes = ( '0' + String( Math.floor( ( time % 3600 ) / 60 ) ) ).substr( -2, 2 );
            var Seconds = ( '0' + String( Math.floor( time % 60 ) ) ).substr( -2, 2 );

            if ( Hours.length == 1 ) {

                Hours = '0' + Hours; }

            Text = Hours + ':' + Minutes + ':' + Seconds; }

        else {

            var Minutes = ( '0' + String( Math.floor( ( time % 3600 ) / 60 ) ) ).substr( -2, 2 );
            var Seconds = ( '0' + String( Math.floor( time % 60 ) ) ).substr( -2, 2 );

            Text = Minutes + ':' + Seconds; }

        return Text;

        };

    $scope.Validate = function ( ) {

      if($scope.Begin === undefined || $scope.End == undefined){
        return false;
      }

        var Days = false;

        for ( var i = 0; i < 7; i++ ) {

            if ( $scope.Days[i] == true ) {

                Days = true;

                break; } }

        if ( !Days ) {

            return false; }

        if ( $scope.Begin.length == 0 || $scope.End.length == 0 ) {

            return false; }

        if ( $scope.Begin.length == $scope.End.length && $scope.Begin >= $scope.End ) {

            return false; }

        if ( $scope.Begin.length > $scope.End.length && $scope.Begin >= ( '0' + $scope.End ) ) {

            return false; }

        if ( $scope.Begin.length < $scope.End.length && ( '0' + $scope.Begin ) >= $scope.End ) {

            return false; }

        return true;

        };

    $scope.SelectTimeInterval = function ( ) {

        if ( $scope.Selected != $scope.Intervals.length ) {

            $scope.Days = [];

            for ( var i = 0; i < $scope.Intervals[ $scope.Selected ].days.length; i++ ) {

                $scope.Days.push( $scope.Intervals[ $scope.Selected ].days[i] ); }

            $scope.Begin = $scope.TimeToText( $scope.Intervals[ $scope.Selected ].begin, true );
            $scope.End = $scope.TimeToText( $scope.Intervals[ $scope.Selected ].end, true ); }

        else {

            $scope.Days = [ false, false, false, false, false, false, false ];

            $scope.Begin = '00:00:00';
            $scope.End = '00:00:00'; }

        };

    $scope.CreateTimeInterval = function ( ) {

        var Interval = {

            days: [],
            begin: 0,
            end: 0,

            text: ''

            };

        var Delta = 0;

        if ( $scope.Begin.length == 7 ) {

            Delta = 1; }

        var BeginHours = parseInt( $scope.Begin.substr( 0, 2 - Delta ) );
        var BeginMinutes = parseInt( $scope.Begin.substr( 3 - Delta, 2 ) );
        var BeginSeconds = parseInt( $scope.Begin.substr( 6 - Delta, 2 ) );

        Interval.begin = BeginHours * 3600 + BeginMinutes * 60 + BeginSeconds;
        Interval.text = Delta > 0 ? '0' + $scope.Begin : $scope.Begin;

        Delta = 0;

        if ( $scope.End.length == 7 ) {

            Delta = 1; }

        var EndHours = parseInt( $scope.End.substr( 0, 2 - Delta ) );
        var EndMinutes = parseInt( $scope.End.substr( 3 - Delta, 2 ) );
        var EndSeconds = parseInt( $scope.End.substr( 6 - Delta, 2 ) );

        Interval.end = EndHours * 3600 + EndMinutes * 60 + EndSeconds;
        Interval.text = Interval.text + ' - ' + ( Delta > 0 ? '0' + $scope.End : $scope.End );

        Interval.days = $scope.Days;

        if ( Interval.days[0] ) {

            Interval.text = 'Nd, ' + Interval.text; }

        if ( Interval.days[6] ) {

            Interval.text = 'Sob, ' + Interval.text; }

        if ( Interval.days[5] ) {

            Interval.text = 'Pt, ' + Interval.text; }

        if ( Interval.days[4] ) {

            Interval.text = 'Czw, ' + Interval.text; }

        if ( Interval.days[3] ) {

            Interval.text = 'Śr, ' + Interval.text; }

        if ( Interval.days[2] ) {

            Interval.text = 'Wt, ' + Interval.text; }

        if ( Interval.days[1] ) {

            Interval.text = 'Pon, ' + Interval.text; }

        $scope.Intervals.push(Interval);

        };

    $scope.UpdateTimeInterval = function ( ) {

        var Delta = 0;

        if ( $scope.Begin.length == 7 ) {

            Delta = 1; }

        var BeginHours = parseInt( $scope.Begin.substr( 0, 2 - Delta ) );
        var BeginMinutes = parseInt( $scope.Begin.substr( 3 - Delta, 2 ) );
        var BeginSeconds = parseInt( $scope.Begin.substr( 6 - Delta, 2 ) );

        $scope.Intervals[ $scope.Selected ].begin = BeginHours * 3600 + BeginMinutes * 60 + BeginSeconds;
        $scope.Intervals[ $scope.Selected ].text = Delta > 0 ? '0' + $scope.Begin : $scope.Begin;

        Delta = 0;

        if ( $scope.End.length == 7 ) {

            Delta = 1; }

        var EndHours = parseInt( $scope.End.substr( 0, 2 - Delta ) );
        var EndMinutes = parseInt( $scope.End.substr( 3 - Delta, 2 ) );
        var EndSeconds = parseInt( $scope.End.substr( 6 - Delta, 2 ) );

        $scope.Intervals[ $scope.Selected ].end = EndHours * 3600 + EndMinutes * 60 + EndSeconds;
        $scope.Intervals[ $scope.Selected ].text = $scope.Intervals[ $scope.Selected ].text + ' - ' + ( Delta > 0 ? '0' + $scope.End : $scope.End );

        $scope.Intervals[ $scope.Selected ].days = $scope.Days;

        if ( $scope.Intervals[ $scope.Selected ].days[0] ) {

            $scope.Intervals[ $scope.Selected ].text = 'Nd, ' + $scope.Intervals[ $scope.Selected ].text; }

        if ( $scope.Intervals[ $scope.Selected ].days[6] ) {

            $scope.Intervals[ $scope.Selected ].text = 'Sob, ' + $scope.Intervals[ $scope.Selected ].text; }

        if ( $scope.Intervals[ $scope.Selected ].days[5] ) {

            $scope.Intervals[ $scope.Selected ].text = 'Pt, ' + $scope.Intervals[ $scope.Selected ].text; }

        if ( $scope.Intervals[ $scope.Selected ].days[4] ) {

            $scope.Intervals[ $scope.Selected ].text = 'Czw, ' + $scope.Intervals[ $scope.Selected ].text; }

        if ( $scope.Intervals[ $scope.Selected ].days[3] ) {

            $scope.Intervals[ $scope.Selected ].text = 'Śr, ' + $scope.Intervals[ $scope.Selected ].text; }

        if ( $scope.Intervals[ $scope.Selected ].days[2] ) {

            $scope.Intervals[ $scope.Selected ].text = 'Wt, ' + $scope.Intervals[ $scope.Selected ].text; }

        if ( $scope.Intervals[ $scope.Selected ].days[1] ) {

            $scope.Intervals[ $scope.Selected ].text = 'Pon, ' + $scope.Intervals[ $scope.Selected ].text; }

        };

    $scope.DeleteTimeInterval = function ( ) {

        $scope.Intervals.splice( $scope.Selected, 1 );

        };

    $scope.hide = function ( ) {

        $mdDialog.hide();

        };

    $scope.cancel = function ( ) {

        $mdDialog.cancel();

        };

    }
