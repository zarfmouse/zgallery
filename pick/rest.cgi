#!/usr/bin/perl 

use strict;
use warnings;
use utf8;

use FindBin qw($RealBin);

use IO::Handle;
STDOUT->autoflush(1);
STDERR->autoflush(1);
STDOUT->binmode(":utf8");
STDERR->binmode(":utf8");

use CGI;
use Data::Dumper qw(Dumper);
use JSON qw(decode_json encode_json);
use Storable qw(lock_store lock_retrieve);
use IO::File;
use Fcntl qw(:flock);

my $data_file = "$RealBin/../images/slides.storable";
my $lock_file = "$data_file.lock";
my $password = 'changeme';

my $lock_handle;

my $cgi = CGI->new();

eval {
    my $mode = $cgi->param('mode');
    if($mode eq 'rotate') {
	write_lock();
	if($cgi->param('password') eq $password) {
	    my $dir = $cgi->param('direction');
	    my $i = $cgi->param('index');
	    my $data = lock_retrieve($data_file);
	    my $root = "$RealBin/..";
	    my $orig_file = "$root/images/$data->{slides}->[$i]->{orig}";
	    my $image_file = "$root/$data->{slides}->[$i]->{image}";
	    my $thumb_file = "$root/$data->{slides}->[$i]->{thumb}";
	    my $deg = 90;
	    if($dir eq 'left') {
		$deg = -90;
	    }
	    system("mogrify -rotate $deg '$orig_file'");
	    system("convert -geometry '1500x1500>' '$orig_file' '$image_file'");
	    system("convert -geometry 200x200^ -gravity Center -crop 200x150+0+0 +repage '$image_file' '$thumb_file'");

	    print $cgi->header("appliation/json");
	    print encode_json({ ok => $orig_file });	
	} else {
	    die "Invalid password.";
	}
    } elsif($cgi->param("POSTDATA")) {
	write_lock();
	my $json = $cgi->param("POSTDATA");
	my $data = decode_json($json);
	if($data->{password} eq $password) {
	    delete $data->{password};
	    lock_store($data => $data_file);
	    print $cgi->header("appliation/json");
	    print $json;
	} else {
	    die "Invalid password.";
	}
    } else {
	read_lock();
	my $data = lock_retrieve($data_file);
	my $json = encode_json($data);
	print $cgi->header("appliation/json");
	print $json;
    }
};

if($@) {
    print $cgi->header(-status => '500 Server Error', 
		       -type => "text/plain");
    print $@;
}

sub read_lock {
    $lock_handle = IO::File->new($lock_file);
    defined($lock_handle) or die "open($lock_file): $!";
    flock($lock_handle, LOCK_SH) or die "Lock failed.";
}

sub write_lock {
    $lock_handle = IO::File->new(">>$lock_file");
    defined($lock_handle) or die "open($lock_file): $!";
    flock($lock_handle, LOCK_EX) or die "Lock failed.";
}
