package com.example.quanly_giaocu.mapper;

import com.example.quanly_giaocu.dto.response.ProposalAttachmentResponse;
import com.example.quanly_giaocu.dto.response.ProposalHistoryResponse;
import com.example.quanly_giaocu.dto.response.ProposalItemResponse;
import com.example.quanly_giaocu.dto.response.ProposalResponse;
import com.example.quanly_giaocu.entity.Group;
import com.example.quanly_giaocu.entity.Proposal;
import com.example.quanly_giaocu.entity.ProposalAttachment;
import com.example.quanly_giaocu.entity.ProposalHistory;
import com.example.quanly_giaocu.entity.ProposalItem;
import com.example.quanly_giaocu.entity.User;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-17T00:52:40+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class ProposalMapperImpl implements ProposalMapper {

    @Override
    public ProposalResponse toProposalResponse(Proposal proposal) {
        if ( proposal == null ) {
            return null;
        }

        ProposalResponse.ProposalResponseBuilder proposalResponse = ProposalResponse.builder();

        proposalResponse.creatorName( proposalCreatorFullName( proposal ) );
        proposalResponse.creatorPosition( proposalCreatorPosition( proposal ) );
        proposalResponse.creatorGroupName( proposalCreatorGroupName( proposal ) );
        proposalResponse.id( proposal.getId() );
        proposalResponse.code( proposal.getCode() );
        proposalResponse.purpose( proposal.getPurpose() );
        proposalResponse.requiredDate( proposal.getRequiredDate() );
        proposalResponse.priority( proposal.getPriority() );
        proposalResponse.status( proposal.getStatus() );
        proposalResponse.estimatedTotal( proposal.getEstimatedTotal() );
        proposalResponse.createdAt( proposal.getCreatedAt() );
        proposalResponse.items( proposalItemListToProposalItemResponseList( proposal.getItems() ) );
        proposalResponse.attachments( proposalAttachmentListToProposalAttachmentResponseList( proposal.getAttachments() ) );
        proposalResponse.histories( proposalHistoryListToProposalHistoryResponseList( proposal.getHistories() ) );
        proposalResponse.supplierName( proposal.getSupplierName() );
        proposalResponse.orderDate( proposal.getOrderDate() );
        proposalResponse.deliveryDate( proposal.getDeliveryDate() );
        proposalResponse.actualTotal( proposal.getActualTotal() );

        return proposalResponse.build();
    }

    private String proposalCreatorFullName(Proposal proposal) {
        if ( proposal == null ) {
            return null;
        }
        User creator = proposal.getCreator();
        if ( creator == null ) {
            return null;
        }
        String fullName = creator.getFullName();
        if ( fullName == null ) {
            return null;
        }
        return fullName;
    }

    private String proposalCreatorPosition(Proposal proposal) {
        if ( proposal == null ) {
            return null;
        }
        User creator = proposal.getCreator();
        if ( creator == null ) {
            return null;
        }
        String position = creator.getPosition();
        if ( position == null ) {
            return null;
        }
        return position;
    }

    private String proposalCreatorGroupName(Proposal proposal) {
        if ( proposal == null ) {
            return null;
        }
        User creator = proposal.getCreator();
        if ( creator == null ) {
            return null;
        }
        Group group = creator.getGroup();
        if ( group == null ) {
            return null;
        }
        String name = group.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    protected ProposalItemResponse proposalItemToProposalItemResponse(ProposalItem proposalItem) {
        if ( proposalItem == null ) {
            return null;
        }

        ProposalItemResponse.ProposalItemResponseBuilder proposalItemResponse = ProposalItemResponse.builder();

        proposalItemResponse.id( proposalItem.getId() );
        proposalItemResponse.name( proposalItem.getName() );
        proposalItemResponse.category( proposalItem.getCategory() );
        proposalItemResponse.quantity( proposalItem.getQuantity() );
        proposalItemResponse.unit( proposalItem.getUnit() );
        proposalItemResponse.price( proposalItem.getPrice() );

        return proposalItemResponse.build();
    }

    protected List<ProposalItemResponse> proposalItemListToProposalItemResponseList(List<ProposalItem> list) {
        if ( list == null ) {
            return null;
        }

        List<ProposalItemResponse> list1 = new ArrayList<ProposalItemResponse>( list.size() );
        for ( ProposalItem proposalItem : list ) {
            list1.add( proposalItemToProposalItemResponse( proposalItem ) );
        }

        return list1;
    }

    protected ProposalAttachmentResponse proposalAttachmentToProposalAttachmentResponse(ProposalAttachment proposalAttachment) {
        if ( proposalAttachment == null ) {
            return null;
        }

        ProposalAttachmentResponse.ProposalAttachmentResponseBuilder proposalAttachmentResponse = ProposalAttachmentResponse.builder();

        proposalAttachmentResponse.id( proposalAttachment.getId() );
        proposalAttachmentResponse.fileName( proposalAttachment.getFileName() );
        proposalAttachmentResponse.fileUrl( proposalAttachment.getFileUrl() );
        proposalAttachmentResponse.fileType( proposalAttachment.getFileType() );

        return proposalAttachmentResponse.build();
    }

    protected List<ProposalAttachmentResponse> proposalAttachmentListToProposalAttachmentResponseList(List<ProposalAttachment> list) {
        if ( list == null ) {
            return null;
        }

        List<ProposalAttachmentResponse> list1 = new ArrayList<ProposalAttachmentResponse>( list.size() );
        for ( ProposalAttachment proposalAttachment : list ) {
            list1.add( proposalAttachmentToProposalAttachmentResponse( proposalAttachment ) );
        }

        return list1;
    }

    protected ProposalHistoryResponse proposalHistoryToProposalHistoryResponse(ProposalHistory proposalHistory) {
        if ( proposalHistory == null ) {
            return null;
        }

        ProposalHistoryResponse.ProposalHistoryResponseBuilder proposalHistoryResponse = ProposalHistoryResponse.builder();

        proposalHistoryResponse.id( proposalHistory.getId() );
        proposalHistoryResponse.note( proposalHistory.getNote() );
        proposalHistoryResponse.createdAt( proposalHistory.getCreatedAt() );

        return proposalHistoryResponse.build();
    }

    protected List<ProposalHistoryResponse> proposalHistoryListToProposalHistoryResponseList(List<ProposalHistory> list) {
        if ( list == null ) {
            return null;
        }

        List<ProposalHistoryResponse> list1 = new ArrayList<ProposalHistoryResponse>( list.size() );
        for ( ProposalHistory proposalHistory : list ) {
            list1.add( proposalHistoryToProposalHistoryResponse( proposalHistory ) );
        }

        return list1;
    }
}
