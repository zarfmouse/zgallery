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
use File::Basename qw(basename);

my $lock_handle;
my $lock_file = "$RealBin/images/.lock";
my $password = 'changeme';
my $images_dir = "$RealBin/images";

my $cgi = CGI->new();

eval {
    my $path = $cgi->path_info();
    my @parts = split(m%/%, $path);
    my $collection;
    my @tags;
    foreach my $part (@parts) {
	if(defined($collection)) {
	    push(@tags, $part);
	} elsif($part eq '-') {
	    $collection = '-';
	} elsif($part =~ m/^[a-zA-Z0-9-_\.]+$/ and -d "$images_dir/$part") {
	    $collection = $part;
	}
    }

    my $mode = $cgi->param('mode');
    if($mode eq 'tags') {
	read_lock();
	my $q = $cgi->param('q');
	my $data = retrieve_data($collection, @tags);
	my %tags;
	foreach my $slide (@{$data->{slides}}) {
	    if(exists($slide->{tags})) {
		foreach my $tag (@{$slide->{tags}}) {
		    if((not defined($q)) or $tag =~ m/^\Q$q/) {
			$tags{$tag} = 1;
		    }
		}
	    }
	}
 	my $json = encode_json([ sort keys %tags ]);
	print $cgi->header("appliation/json");
	print $json;
    } elsif($mode eq 'rotate') {
	die "Invalid collection" unless defined($collection);
	die "Invalid collection" unless $collection ne '-';
	write_lock();
	my $dir = $cgi->param('direction');
	my $i = $cgi->param('index');
	my $data = retrieve_data($collection, @tags);
	my $orig_file;
	my $image_file = "$RealBin/$data->{slides}->[$i]->{image}";
	my $thumb_file = "$RealBin/$data->{slides}->[$i]->{thumb}";
	if(defined($data->{slides}->[$i]->{orig})) {
	    $orig_file = "$RealBin/$data->{slides}->[$i]->{orig}";
	} else {
	    $orig_file = $image_file;
	}
	my $deg = 90;
	if($dir eq 'left') {
	    $deg = -90;
	}
	system("mogrify -rotate $deg '$orig_file'");
	system("convert -geometry '1500x1500>' '$orig_file' '$image_file'");
	system("convert -geometry 200x200^ -gravity Center -crop 200x150+0+0 +repage '$image_file' '$thumb_file'");
	print $cgi->header("appliation/json");
	print encode_json({ ok => $orig_file });	
    } elsif($cgi->param("POSTDATA")) {
	die "Invalid collection" unless defined($collection);
	die "Invalid collection" unless $collection ne '-';
	my $data_file = "$images_dir/$collection/slides.storable";
	die "Missing slides data" unless -f $data_file;
	write_lock();
	my $json = $cgi->param("POSTDATA");
	my $data = decode_json($json);
	my %tags;
	foreach my $slide (@{$data->{slides}}) {
	    if(exists($slide->{tags})) {
		foreach my $tag (@{$slide->{tags}}) {
		    $tags{$tag} = 1;
		}
	    }
	}
	$data->{availableTags} = [ sort keys %tags ];
	lock_store($data => "$images_dir/$collection/slides.storable");
	print $cgi->header("appliation/json");
	print $json;
    } else {
	read_lock();
	my $data = retrieve_data($collection, @tags);
	if($cgi->param('active')) {
	    @{$data->{slides}} = grep {$_->{active}} @{$data->{slides}};
	}
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

sub retrieve_data {
    my $collection = shift;
    my @tags = @_;
    my $title_tags = join(', ', @tags);
    my $all_data = { slides => [] };
    my @collections;
    if($collection eq '-') {
	@collections = glob("$images_dir/*");
	$all_data->{title} = "$title_tags - Photos";
    } else {
	@collections = ("$images_dir/$collection");
    }
    foreach my $collection_dir (@collections) {
	my $collection = basename($collection_dir);
	my $data_file = "$collection_dir/slides.storable";
	die "Missing slides data." unless -f $data_file;
	my $data = lock_retrieve($data_file);
	if(scalar(@collections) == 1) {
	    if(scalar(@tags) > 0) {
		$all_data->{title} = "$title_tags - $data->{title}";
	    } else {
		$all_data->{title} = $data->{title};
	    }
	}
	foreach my $slide (@{$data->{slides}}) {
	    my $all_match = 1;
	    if(scalar(@tags) > 0) {
		foreach my $tag (@tags) {
		    my $match = 0;
		    foreach my $slide_tag (@{$slide->{tags}}) {
			$match ||= ($slide_tag eq $tag);
		    }
		    $all_match &&= $match;
		}
	    }
	    if($all_match) {
		push(@{$all_data->{slides}}, $slide);
	    }
	}
    }
    return $all_data;
}

sub read_lock {
    $lock_handle = IO::File->new($lock_file);
    defined($lock_handle) or die "open($lock_file): $!";
    flock($lock_handle, LOCK_SH) or die "Lock failed.";
}

sub write_lock {
    if($cgi->url_param('password') eq $password) {
	$lock_handle = IO::File->new(">>$lock_file");
	defined($lock_handle) or die "open($lock_file): $!";
	flock($lock_handle, LOCK_EX) or die "Lock failed.";
    } else {
	die "Invalid password: ".$cgi->param('password');
    }
}
