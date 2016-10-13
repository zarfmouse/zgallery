#!/usr/bin/env perl                                                                      
use strict;
use warnings;

use FindBin qw($RealBin);
BEGIN {
    my $file = $RealBin;
    $file =~ s{/.*$}{zcme-lib-perl/setup.pl};
    require $file;
};

use Getopt::Long qw(GetOptions);
my $help = 0;
my $VERBOSE = 0;
my $DRY_RUN = 0;
my $collection;
my $use_test_user = 0;
my $base_url;
GetOptions(
    "help" => \$help,
    "verbose" => \$VERBOSE,
    "dry-run" => \$DRY_RUN,
    "collection=s" => \$collection,
    "use-test-user" => \$use_test_user,
    "base-url=s" => \$base_url,
    );

my $Usage = <<"USAGE";
$0 [--help]
$0 [--verbose] [--dry-run] [--use-test-user] --collection=STR --base-url=URL
USAGE
    ;
$help and die $Usage;
defined($collection) or die "--collection is required.\n$Usage";
defined($base_url) or die "--base-url is required.\n$Usage";

my $url = "$base_url/$collection";

use ZCME::Facebook::Graph;
use Data::Dumper qw(Dumper);
use Storable qw(lock_retrieve lock_store);
use JSON qw(encode_json);
use Date::Parse qw(str2time);;

my $account = 'admin';
my $fb = ZCME::Facebook::Graph->new(-account => $account);

my $app_id = $fb->oauth()->client_id();
my $app_token = $fb->oauth()->app_access_token();
my $user_token;

my $images_dir = "$RealBin/../images";

if($use_test_user) {
    my $test_user = $fb->test_users()->[0];
    $test_user->install(-permissions => [qw(publish_actions user_photos)]);
    $user_token = $test_user->access_token();
    print "Test User Info: \n" if $VERBOSE;
    print Dumper($test_user->{_content}) if $VERBOSE;
} else {
    $user_token = $fb->oauth()->user_access_token();
}

print "Token Info: \n" if $VERBOSE;
print Dumper($fb->debug_token($user_token)) if $VERBOSE;

my $slides_data_file = "$images_dir/$collection/slides.storable";
-f $slides_data_file or die "$slides_data_file not found.";

my $slides_data = lock_retrieve($slides_data_file);

my $privacy = encode_json({ value => 'ALL_FRIENDS' });

unless(defined($slides_data->{facebook_album_id})) {
    my $title = $slides_data->{title};
    print "Creating Facebook Album: $title.\n" if $VERBOSE;
    unless($DRY_RUN) {
	my $resp = $fb->rest("POST", "me/albums", 
			     {
				 access_token => $user_token,
				 name => $title,
				 privacy => $privacy,
				 message => $url,
			     });
	$slides_data->{facebook_album_id} = $resp->{id};
    }
}
print "Facebook Album ID: $slides_data->{facebook_album_id}.\n" if $VERBOSE;

foreach my $slide (@{$slides_data->{slides}}) {
    next unless $slide->{active};
    next if $slide->{facebook_photo_id};
    my $hash_key = $slide->{image};
    $hash_key =~ s(^images/)();
    my $slide_url = "$url?pause=1#$hash_key";
    my $orig_url = "$base_url/$slide->{orig}";
    my (undef,$datetime) = split(/=/,`identify -format "%[EXIF:*]" '$images_dir/../$slide->{orig}'  | grep exif:DateTimeOriginal`);
    my $caption = $slide->{title};
    $caption =~ s/\<[^>]*\>//g;
    print "Uploading $hash_key\n" if $VERBOSE;
    unless($DRY_RUN) {
	my $resp = $fb->rest("POST", "$slides_data->{facebook_album_id}/photos", 
			     {
				 access_token => $user_token,
				 url => $orig_url,
				 caption => "$caption\n$slide_url",
				 privacy => $privacy,
				 backdated_time => $datetime,
				 backdated_time_granularity => 'min',
			     });
	my $id = $resp->{id};
	my $link = $fb->rest("GET", [$id, {fields => 'link',
					   access_token => $user_token}])->{link};
	$slide->{facebook_photo_id} = $id;
	$slide->{fb_url} = $link;
    }
}

END {
    if(defined($slides_data) and 
       defined($slides_data->{facebook_album_id}) and 
       -f $slides_data_file and 
       !$DRY_RUN) {
	lock_store($slides_data => $slides_data_file);
    }
}


__END__



